import { NextResponse } from "next/server";
import { db } from "@/db";
import { itemRequests, media, messages } from "@/db/schema";
import { rateLimit, randomRef, isEmail, isPhone, str, sniffMime, MAX_UPLOAD } from "@/lib/security";

export async function POST(req: Request) {
  if (!(await rateLimit("requests", 5, 10 * 60_000))) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  if (str(fd.get("website"))) return NextResponse.json({ reference: "PR-OK" }); // honeypot
  const description = str(fd.get("description"), 1500), email = str(fd.get("email"), 200), whatsapp = str(fd.get("whatsapp"), 20);
  let imageUrl = str(fd.get("imageUrl"), 500);
  if (description.length < 5) return NextResponse.json({ error: "Please describe the item." }, { status: 400 });
  if (!isEmail(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!isPhone(whatsapp)) return NextResponse.json({ error: "Please enter a valid WhatsApp number." }, { status: 400 });
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) imageUrl = "";
  const budgetRaw = str(fd.get("budget"), 10);
  const budget = budgetRaw && !isNaN(+budgetRaw) && +budgetRaw >= 0 ? String(Math.min(+budgetRaw, 1e6)) : null;
  let imageMediaId: number | null = null;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD) return NextResponse.json({ error: "Image too large (max 5MB)." }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = sniffMime(buf);
    if (!mime || !mime.startsWith("image/") || mime === "image/gif") return NextResponse.json({ error: "Image must be JPG, PNG or WebP." }, { status: 400 });
    imageMediaId = (await db.insert(media).values({ mime, data: buf, isPublic: false }).returning({ id: media.id }))[0].id;
  }
  const reference = randomRef("PR");
  await db.insert(itemRequests).values({ reference, description, imageUrl, imageMediaId, colour: str(fd.get("colour"), 60), size: str(fd.get("size"), 30), budget, whatsapp, email, notes: str(fd.get("notes"), 1500), log: [{ at: new Date().toISOString(), text: "Request submitted by customer" }] });
  await db.insert(messages).values({ kind: "notification", email, body: `New item request ${reference}: ${description.slice(0, 80)}` });
  return NextResponse.json({ reference });
}
