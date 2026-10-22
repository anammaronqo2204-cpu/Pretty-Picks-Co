import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, str } from "@/lib/security";
import { ORDER_STATUSES, PAYMENT_STATUSES, FULFILMENT_STEPS } from "@/lib/constants";
import { deliveryText } from "@/lib/format";

const CUSTOMER_ITEM: Record<string, string> = { order_placed: "Awaiting payment", payment_verified: "Payment confirmed", placed_with_supplier: "Ordered from supplier", supplier_dispatched: "Dispatched by supplier", in_transit: "In transit", arrived_for_checking: "Arrived for checking", checked: "Checked. Preparing delivery", delivered: "Delivered", cancelled: "Cancelled" };

export async function POST(req: Request) {
  if (!(await rateLimit("track", 15))) return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const ref = str(b.reference, 20).toUpperCase(), email = str(b.email, 200).toLowerCase();
  const o = (await db.select().from(orders).where(eq(orders.reference, ref)).limit(1))[0];
  // Same message for wrong ref or wrong email. No order enumeration
  if (!o || o.email.toLowerCase() !== email) return NextResponse.json({ error: "We couldn't find an order with those details." }, { status: 404 });
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  void FULFILMENT_STEPS;
  return NextResponse.json({
    reference: o.reference, status: ORDER_STATUSES[o.status] ?? o.status, paymentStatus: PAYMENT_STATUSES[o.paymentStatus] ?? o.paymentStatus,
    createdAt: o.createdAt, total: o.total,
    items: items.map((i) => ({ title: i.title, quantity: i.quantity, status: CUSTOMER_ITEM[i.fulfilmentStatus] ?? "Processing", trackingNumber: i.trackingNumber, delivery: deliveryText(i.deliveryMin, i.deliveryMax) })),
    link: `/order/${o.reference}?t=${o.accessToken}`,
  });
}
