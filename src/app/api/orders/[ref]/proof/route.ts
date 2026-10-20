import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, media, paymentProofs, paymentEvents, messages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { rateLimit, safeEqual, sha256, sniffMime, ALLOWED_PROOF, MAX_UPLOAD } from "@/lib/security";

export async function POST(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  if (!(await rateLimit("proof", 6, 10 * 60_000))) return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });
  const { ref } = await params;
  const fd = await req.formData().catch(() => null);
  const t = String(fd?.get("token") ?? "");
  const o = (await db.select().from(orders).where(eq(orders.reference, ref.toUpperCase())).limit(1))[0];
  if (!o || !safeEqual(o.accessToken, t)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!["awaiting_proof", "rejected", "awaiting_verification"].includes(o.paymentStatus) || o.status === "cancelled") return NextResponse.json({ error: "This order isn't accepting proof of payment." }, { status: 400 });
  const file = fd?.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Please choose a file." }, { status: 400 });
  if (file.size > MAX_UPLOAD) return NextResponse.json({ error: "File too large (max 5MB)." }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(buf);
  if (!mime || !ALLOWED_PROOF.includes(mime)) return NextResponse.json({ error: "Only PDF, JPG, PNG or WebP files are accepted." }, { status: 400 });
  const hash = sha256(buf);
  const dup = await db.select({ id: paymentProofs.id }).from(paymentProofs).where(and(eq(paymentProofs.orderId, o.id), eq(paymentProofs.sha256, hash))).limit(1);
  if (dup.length) return NextResponse.json({ error: "This file has already been uploaded for this order." }, { status: 409 });
  const pending = await db.select({ id: paymentProofs.id }).from(paymentProofs).where(and(eq(paymentProofs.orderId, o.id), eq(paymentProofs.status, "pending")));
  if (pending.length >= 3) return NextResponse.json({ error: "We already have proofs awaiting review. We'll be in touch." }, { status: 409 });
  await db.transaction(async (tx) => {
    const [m] = await tx.insert(media).values({ mime, data: buf, isPublic: false }).returning({ id: media.id });
    await tx.insert(paymentProofs).values({ orderId: o.id, mediaId: m.id, fileName: file.name.slice(0, 120), sha256: hash });
    await tx.update(orders).set({ paymentStatus: "awaiting_verification", updatedAt: new Date() }).where(eq(orders.id, o.id));
    await tx.insert(paymentEvents).values({ orderId: o.id, actor: "customer", event: "proof_uploaded", detail: file.name.slice(0, 120) });
    await tx.insert(messages).values({ kind: "notification", body: `Proof of payment uploaded for ${o.reference}` });
  });
  return NextResponse.json({ ok: true });
}
