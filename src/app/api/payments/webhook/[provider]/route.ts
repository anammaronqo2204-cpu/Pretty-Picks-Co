import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, paymentEvents, orderItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { providers } from "@/lib/payments";

/**
 * Gateway webhook endpoint (PayFast ITN / Yoco webhooks). Inactive until a provider
 * implements verifyWebhook (signature check + server-side validation). Requires configuration.
 */
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const p = providers.find((x) => x.id === provider && x.enabled());
  if (!p?.verifyWebhook) return NextResponse.json({ error: "Provider not configured" }, { status: 404 });
  const result = await p.verifyWebhook(req);
  if (!result) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const o = (await db.select().from(orders).where(eq(orders.reference, result.reference)).limit(1))[0];
  if (!o || Math.abs(Number(o.total) - result.amount) > 0.01) return NextResponse.json({ error: "Mismatch" }, { status: 400 });
  if (o.paymentStatus !== "verified") {
    await db.update(orders).set({ paymentStatus: "verified", status: "payment_confirmed", updatedAt: new Date() }).where(eq(orders.id, o.id));
    await db.update(orderItems).set({ fulfilmentStatus: "payment_verified" }).where(and(eq(orderItems.orderId, o.id), eq(orderItems.fulfilmentStatus, "order_placed")));
    await db.insert(paymentEvents).values({ orderId: o.id, actor: `webhook:${provider}`, event: "payment_verified", detail: `Amount R${result.amount}` });
  }
  return NextResponse.json({ ok: true });
}
