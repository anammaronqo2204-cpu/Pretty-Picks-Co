import { NextResponse } from "next/server";
import { unzipSync } from "fflate";
import { db } from "@/db";
import { products, media } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getAdmin } from "@/lib/auth";
import { sniffMime, ALLOWED_IMG, rateLimit } from "@/lib/security";
import { parseProductFilename, isImageName } from "@/lib/filename-parse";
import { SUPPLIER_PRESETS, STOCK_STATUSES, CATEGORIES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ZIP = 25 * 1024 * 1024; // 25MB compressed
const MAX_FILE = 5 * 1024 * 1024; // per image (uncompressed)
const MAX_FILES = 100;
const MAX_UNCOMPRESSED = 60 * 1024 * 1024; // zip-bomb guard

type Override = { title?: string; price?: number; include?: boolean };

export async function POST(req: Request) {
  // Server-side authorisation: admins only
  if (!(await getAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  if (!(await rateLimit("bulk-import", 10, 10 * 60_000))) return NextResponse.json({ error: "Too many imports. Wait a few minutes." }, { status: 429 });

  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  const zip = fd.get("zip");
  if (!(zip instanceof File) || zip.size === 0) return NextResponse.json({ error: "Choose a ZIP file." }, { status: 400 });
  if (zip.size > MAX_ZIP) return NextResponse.json({ error: `ZIP is too large (${(zip.size / 1048576).toFixed(1)}MB). Max 25MB. Compress your photos first.` }, { status: 400 });

  let overrides: Record<string, Override> = {};
  try { overrides = JSON.parse(String(fd.get("overrides") ?? "{}")); } catch { overrides = {}; }

  const supplierName = String(fd.get("supplier") ?? "SHEIN").slice(0, 80);
  const preset = SUPPLIER_PRESETS.find((p) => p.name === supplierName);
  const deliveryMin = clampInt(fd.get("deliveryMin"), preset?.deliveryMin ?? 10, 1, 120);
  const deliveryMax = Math.max(deliveryMin, clampInt(fd.get("deliveryMax"), preset?.deliveryMax ?? 18, 1, 180));
  const category = CATEGORIES.includes(String(fd.get("category"))) ? String(fd.get("category")) : "Accessories";
  const collections = fd.getAll("collections").map(String).slice(0, 20);
  const status = ["draft", "published"].includes(String(fd.get("status"))) ? String(fd.get("status")) : "draft";
  const stockStatus = String(fd.get("stockStatus") ?? "supplier");
  const skipExisting = fd.get("skipExisting") === "1";
  const sharedDescription = String(fd.get("description") ?? "").slice(0, 2000).trim();

  const buf = new Uint8Array(await zip.arrayBuffer());

  // Guard before inflating: fflate calls filter per entry before decompressing.
  const skipped: { file: string; reason: string }[] = [];
  let budget = MAX_UNCOMPRESSED;
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(buf, {
      filter: (f) => {
        const base = f.name.split("/").pop() ?? f.name;
        if (f.name.endsWith("/") || f.name.startsWith("__MACOSX/") || base.startsWith(".") || !isImageName(base)) {
          if (!f.name.endsWith("/")) skipped.push({ file: f.name, reason: "Not a JPG/PNG/WebP/GIF image" });
          return false;
        }
        if (f.originalSize > MAX_FILE) { skipped.push({ file: f.name, reason: "Larger than 5MB" }); return false; }
        if (f.originalSize > budget) { skipped.push({ file: f.name, reason: "ZIP content too large" }); return false; }
        budget -= f.originalSize;
        return true;
      },
    });
  } catch {
    return NextResponse.json({ error: "That file isn't a readable ZIP. Re-zip your images and try again." }, { status: 400 });
  }

  const files = Object.entries(entries);
  if (files.length === 0) return NextResponse.json({ error: "No JPG, PNG, WebP or GIF images found in the ZIP." }, { status: 400 });
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Too many images (${files.length}). Import ${MAX_FILES} at a time.` }, { status: 400 });

  // Slugs: account for existing products + duplicates inside this batch
  const wanted = files.map(([name]) => parseProductFilename(name).slugBase);
  const existing = wanted.length ? await db.select({ slug: products.slug }).from(products).where(inArray(products.slug, wanted)) : [];
  const usedSlugs = new Set(existing.map((e) => e.slug));
  const uniqueSlug = (base: string) => {
    let slug = base, i = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${i++}`;
    usedSlugs.add(slug);
    return slug;
  };

  let titles: string[] = [];
  if (skipExisting) {
    titles = files.map(([name]) => overrides[name]?.title?.trim() || parseProductFilename(name).title);
    const dupes = titles.length ? await db.select({ title: products.title }).from(products).where(inArray(products.title, titles)) : [];
    const dupeSet = new Set(dupes.map((d) => d.title.toLowerCase()));
    for (let i = files.length - 1; i >= 0; i--) {
      if (dupeSet.has(titles[i].toLowerCase())) { skipped.push({ file: files[i][0], reason: "A product with this name already exists" }); files.splice(i, 1); titles.splice(i, 1); }
    }
  }

  const errors: { file: string; reason: string }[] = [];
  const created: { id: number; title: string; price: number; slug: string }[] = [];

  for (const [name, data] of files) {
    const ov = overrides[name] ?? {};
    if (ov.include === false) { skipped.push({ file: name, reason: "Deselected" }); continue; }
    const parsed = parseProductFilename(name);
    const title = (ov.title?.trim() || parsed.title).slice(0, 120);
    const price = Number(ov.price) > 0 ? Math.round(Number(ov.price) * 100) / 100 : parsed.price;
    if (title.length < 2) { errors.push({ file: name, reason: "Missing product name" }); continue; }
    if (!price || price <= 0) { errors.push({ file: name, reason: "Missing price" }); continue; }
    const mime = sniffMime(Buffer.from(data));
    if (!mime || !ALLOWED_IMG.includes(mime)) { errors.push({ file: name, reason: "File is not a real image" }); continue; }
    const slug = uniqueSlug(parseProductFilename(name).slugBase);
    try {
      const row = await db.transaction(async (tx) => {
        const [m] = await tx.insert(media).values({ mime, data: Buffer.from(data), isPublic: true }).returning({ id: media.id });
        const [p] = await tx.insert(products).values({
          title, slug, description: sharedDescription,
          images: [`/api/media/${m.id}`], category, collectionSlugs: collections, supplierName,
          supplierUrl: "", supplierCost: "0", sourcingCost: "0", markupPercent: "100",
          price: String(price), deliveryMin, deliveryMax,
          sizes: [], colours: [], variants: [],
          stockStatus: stockStatus in STOCK_STATUSES ? stockStatus : "supplier",
          status, featured: false, isDemo: false,
          internalNotes: `Bulk ZIP import ${new Date().toISOString().slice(0, 10)}. Original file: ${name}. Supplier cost & markup not set yet.`,
        }).returning({ id: products.id, title: products.title, price: products.price, slug: products.slug });
        return p;
      });
      created.push({ id: row.id, title: row.title, price: Number(row.price), slug: row.slug });
    } catch {
      errors.push({ file: name, reason: "Could not save this product" });
    }
  }

  return NextResponse.json({ created, skipped, errors, deliveryMin, deliveryMax, supplierName });
}

function clampInt(v: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
