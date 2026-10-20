import "server-only";
import { db } from "@/db";
import { products, collections, settings, discountCodes, policies } from "@/db/schema";
import { and, eq, or, isNull, lte, asc, desc, inArray, sql, ilike, gte, SQL } from "drizzle-orm";
import { ensureSeed, DEFAULT_SETTINGS, SiteSettings } from "./seed";

/** Only these columns are ever exposed publicly. Never add supplier/cost fields here. */
export const publicProductColumns = {
  id: products.id, title: products.title, slug: products.slug, description: products.description,
  specs: products.specs, images: products.images, category: products.category, collectionSlugs: products.collectionSlugs,
  brand: products.brand, price: products.price, compareAtPrice: products.compareAtPrice, deliveryMin: products.deliveryMin,
  deliveryMax: products.deliveryMax, sizes: products.sizes, colours: products.colours, variants: products.variants,
  stockStatus: products.stockStatus, featured: products.featured, isDemo: products.isDemo, createdAt: products.createdAt,
};
export type PublicProduct = {
  id: number; title: string; slug: string; description: string; specs: Record<string, string>; images: string[];
  category: string; collectionSlugs: string[]; brand: string; price: string; compareAtPrice: string | null;
  deliveryMin: number; deliveryMax: number; sizes: string[]; colours: string[]; variants: { name: string; priceAdjust?: number; available?: boolean }[];
  stockStatus: string; featured: boolean; isDemo: boolean; createdAt: Date;
};

export const livePredicate = () => and(eq(products.status, "published"), or(isNull(products.publishAt), lte(products.publishAt, new Date())));

export type ShopFilters = { q?: string; category?: string; collection?: string; min?: string; max?: string; delivery?: string; size?: string; colour?: string; availability?: string; featured?: string; newIn?: string; sort?: string };

export async function listProducts(f: ShopFilters = {}, limit = 60): Promise<PublicProduct[]> {
  await ensureSeed();
  const conds: (SQL | undefined)[] = [livePredicate()];
  if (f.q) conds.push(or(ilike(products.title, `%${f.q}%`), ilike(products.category, `%${f.q}%`), ilike(products.description, `%${f.q}%`)));
  if (f.category) conds.push(eq(products.category, f.category));
  if (f.collection) conds.push(sql`${products.collectionSlugs} @> ${JSON.stringify([f.collection])}::jsonb`);
  if (f.min && !isNaN(+f.min)) conds.push(gte(products.price, String(+f.min)));
  if (f.max && !isNaN(+f.max)) conds.push(lte(products.price, String(+f.max)));
  if (f.delivery === "fast") conds.push(lte(products.deliveryMax, 7));
  if (f.delivery === "mid") conds.push(lte(products.deliveryMax, 14));
  if (f.size) conds.push(sql`${products.sizes} @> ${JSON.stringify([f.size])}::jsonb`);
  if (f.colour) conds.push(sql`${products.colours}::text ilike ${"%" + f.colour + "%"}`);
  if (f.availability === "local") conds.push(eq(products.stockStatus, "local"));
  if (f.availability === "available") conds.push(sql`${products.stockStatus} <> 'unavailable'`);
  if (f.featured) conds.push(eq(products.featured, true));
  if (f.newIn) conds.push(gte(products.createdAt, new Date(Date.now() - 30 * 86400000)));
  const order =
    f.sort === "newest" ? [desc(products.createdAt)] :
    f.sort === "price-asc" ? [asc(products.price)] :
    f.sort === "price-desc" ? [desc(products.price)] :
    f.sort === "popular" ? [desc(products.salesCount), desc(products.createdAt)] :
    [desc(products.featured), desc(products.createdAt)];
  return db.select(publicProductColumns).from(products).where(and(...conds)).orderBy(...order).limit(limit) as Promise<PublicProduct[]>;
}

export async function getProductBySlug(slug: string, preview = false): Promise<PublicProduct | null> {
  await ensureSeed();
  const rows = await db.select(publicProductColumns).from(products).where(preview ? eq(products.slug, slug) : and(eq(products.slug, slug), livePredicate())).limit(1);
  return (rows[0] as PublicProduct) ?? null;
}

export async function getFacets() {
  await ensureSeed();
  const rows = await db.select({ sizes: products.sizes, colours: products.colours, category: products.category }).from(products).where(livePredicate());
  const sizes = new Set<string>(), colours = new Set<string>(), cats = new Set<string>();
  rows.forEach((r) => { r.sizes.forEach((s) => sizes.add(s)); r.colours.forEach((c) => colours.add(c)); cats.add(r.category); });
  return { sizes: [...sizes], colours: [...colours].sort(), categories: [...cats].sort() };
}

export async function hasSalesData() {
  const [{ n }] = await db.select({ n: sql<number>`coalesce(sum(${products.salesCount}),0)::int` }).from(products);
  return n > 0;
}

export async function listCollections(activeOnly = true) {
  await ensureSeed();
  return db.select().from(collections).where(activeOnly ? eq(collections.active, true) : undefined).orderBy(asc(collections.sortOrder));
}

export async function getSettings(): Promise<SiteSettings> {
  await ensureSeed();
  const r = await db.select().from(settings).where(eq(settings.key, "site")).limit(1);
  const v = (r[0]?.value ?? {}) as Partial<SiteSettings>;
  return { ...DEFAULT_SETTINGS, ...v, bank: { ...DEFAULT_SETTINGS.bank, ...(v.bank ?? {}) } };
}
/** Settings safe to send to the browser (no bank details unless verified, handled separately) */
export async function getPublicSettings() {
  const s = await getSettings();
  return { businessEmail: s.businessEmail, whatsapp: s.whatsapp, instagram: s.instagram, tiktok: s.tiktok, shippingFee: s.shippingFee, freeShippingOver: s.freeShippingOver };
}

export async function getPolicy(slug: string) {
  await ensureSeed();
  return (await db.select().from(policies).where(eq(policies.slug, slug)).limit(1))[0] ?? null;
}
export async function listPolicies() {
  await ensureSeed();
  return db.select({ slug: policies.slug, title: policies.title }).from(policies);
}

export type CartLine = { productId: number; quantity: number; size?: string | null; colour?: string | null; variant?: string | null };

/** Authoritative server-side cart pricing. Never trusts client prices. */
export async function priceCart(lines: CartLine[], code?: string | null) {
  await ensureSeed();
  const ids = [...new Set(lines.map((l) => Number(l.productId)).filter(Number.isInteger))];
  const rows = ids.length ? await db.select().from(products).where(and(inArray(products.id, ids), livePredicate())) : [];
  const errors: string[] = [];
  const items = [] as { productId: number; title: string; slug: string; image: string; size: string | null; colour: string | null; variant: string | null; quantity: number; unitPrice: number; unitCost: number; supplierName: string; deliveryMin: number; deliveryMax: number }[];
  for (const l of lines.slice(0, 50)) {
    const p = rows.find((r) => r.id === Number(l.productId));
    const qty = Math.max(1, Math.min(10, Math.floor(Number(l.quantity) || 1)));
    if (!p) { errors.push("An item in your cart is no longer available."); continue; }
    if (p.stockStatus === "unavailable") { errors.push(`${p.title} is currently unavailable.`); continue; }
    if (p.sizes.length && (!l.size || !p.sizes.includes(l.size))) { errors.push(`Please choose a size for ${p.title}.`); continue; }
    if (p.colours.length && (!l.colour || !p.colours.includes(l.colour))) { errors.push(`Please choose a colour for ${p.title}.`); continue; }
    let adj = 0;
    if (p.variants.length && l.variant) {
      const v = p.variants.find((v) => v.name === l.variant);
      if (!v || v.available === false) { errors.push(`${p.title} – option unavailable.`); continue; }
      adj = Number(v.priceAdjust ?? 0);
    }
    items.push({ productId: p.id, title: p.title, slug: p.slug, image: p.images[0] ?? "", size: l.size ?? null, colour: l.colour ?? null, variant: l.variant ?? null, quantity: qty, unitPrice: Number(p.price) + adj, unitCost: Number(p.supplierCost) + Number(p.sourcingCost), supplierName: p.supplierName, deliveryMin: p.deliveryMin, deliveryMax: p.deliveryMax });
  }
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  let discount = 0, appliedCode: string | null = null, codeMessage = "";
  if (code) {
    const dc = (await db.select().from(discountCodes).where(and(eq(discountCodes.code, code.toUpperCase().trim()), eq(discountCodes.active, true))).limit(1))[0];
    if (!dc) codeMessage = "That code isn't valid.";
    else if (subtotal < Number(dc.minSubtotal)) codeMessage = `This code needs a minimum spend of R${Number(dc.minSubtotal)}.`;
    else {
      discount = dc.type === "percent" ? Math.round(subtotal * Number(dc.value)) / 100 : Math.min(subtotal, Number(dc.value));
      appliedCode = dc.code; codeMessage = "Code applied ✨";
    }
  }
  const s = await getSettings();
  const shipping = items.length === 0 ? 0 : subtotal - discount >= s.freeShippingOver ? 0 : s.shippingFee;
  const total = Math.max(0, subtotal - discount + shipping);
  const suppliers = new Set(items.map((i) => i.supplierName));
  const ranges = new Set(items.map((i) => `${i.deliveryMin}-${i.deliveryMax}`));
  return { items, subtotal, discount, appliedCode, codeMessage, shipping, total, errors, multiSupplier: suppliers.size > 1, mixedDelivery: ranges.size > 1, eftFee: s.eftFeePerOrder };
}
