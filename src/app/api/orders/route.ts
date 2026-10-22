import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, paymentEvents, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { priceCart, CartLine } from "@/lib/data";
import { rateLimit, randomRef, token, isEmail, isPhone, str } from "@/lib/security";
import { getProvider } from "@/lib/payments";
import { PROVINCES } from "@/lib/constants";

export async function POST(req: Request) {
  if (!(await rateLimit("orders", 8, 10 * 60_000))) return NextResponse.json({ error: "Too many orders from this connection. Please wait a few minutes." }, { status: 429 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const f = {
    customerName: str(b.customerName, 100), email: str(b.email, 200).toLowerCase(), phone: str(b.phone, 20), address: str(b.address, 200),
    suburb: str(b.suburb, 80), city: str(b.city, 80), province: str(b.province, 40), postalCode: str(b.postalCode, 4), instructions: str(b.instructions, 500),
  };
  const errs: string[] = [];
  if (f.customerName.length < 2) errs.push("Please enter your full name.");
  if (!isEmail(f.email)) errs.push("Please enter a valid email.");
  if (!isPhone(f.phone)) errs.push("Please enter a valid mobile number.");
  if (f.address.length < 4 || !f.suburb || !f.city) errs.push("Please complete your delivery address.");
  if (!PROVINCES.includes(f.province)) errs.push("Please choose a province.");
  if (!/^[0-9]{4}$/.test(f.postalCode)) errs.push("Postal code must be 4 digits.");
  if (b.terms !== "yes") errs.push("Please accept the order terms.");
  const provider = getProvider(str(b.paymentMethod, 20) || "eft");
  if (!provider) errs.push("Please choose a valid payment method.");
  if (errs.length) return NextResponse.json({ error: errs.join(" ") }, { status: 400 });

  const idem = str(b.idempotencyKey, 64) || null;
  if (idem) {
    const ex = (await db.select({ reference: orders.reference, token: orders.accessToken }).from(orders).where(eq(orders.idempotencyKey, idem)).limit(1))[0];
    if (ex) return NextResponse.json(ex); // duplicate submission → same order
  }
  const lines: CartLine[] = Array.isArray(b.lines) ? b.lines : [];
  const q = await priceCart(lines, typeof b.code === "string" ? b.code : null);
  if (!q.items.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  if (q.errors.length) return NextResponse.json({ error: [...new Set(q.errors)].join(" ") }, { status: 400 });

  const reference = randomRef("PP"), accessToken = token();
  const order = await db.transaction(async (tx) => {
    const [o] = await tx.insert(orders).values({
      ...f, reference, accessToken, idempotencyKey: idem, subtotal: String(q.subtotal), discount: String(q.discount), discountCode: q.appliedCode,
      shipping: String(q.shipping), total: String(q.total), transactionFee: String(q.eftFee), paymentMethod: provider!.id,
    }).returning();
    await tx.insert(orderItems).values(q.items.map((i) => ({
      orderId: o.id, productId: i.productId, title: i.title, size: i.size, colour: i.colour, variant: i.variant, quantity: i.quantity,
      unitPrice: String(i.unitPrice), unitCost: String(i.unitCost), supplierName: i.supplierName, deliveryMin: i.deliveryMin, deliveryMax: i.deliveryMax,
    })));
    await tx.insert(paymentEvents).values({ orderId: o.id, actor: "customer", event: "order_created", detail: `Total R${q.total} via ${provider!.id}` });
    await tx.insert(messages).values({ kind: "notification", name: f.customerName, email: f.email, body: `New order ${reference}. R${q.total}` });
    return o;
  });
  await provider!.initiate({ reference, total: q.total });
  return NextResponse.json({ reference: order.reference, token: order.accessToken });
}
