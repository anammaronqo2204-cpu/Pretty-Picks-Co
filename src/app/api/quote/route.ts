import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { priceCart, CartLine } from "@/lib/data";
import { rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  if (!(await rateLimit("quote", 60))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const lines: CartLine[] = Array.isArray(body.lines) ? body.lines.slice(0, 50) : [];
  const q = await priceCart(lines, typeof body.code === "string" ? body.code.slice(0, 40) : null);
  const ids = [...new Set(lines.map((l) => Number(l.productId)).filter(Number.isInteger))];
  const rows = ids.length ? await db.select({ id: products.id, sizes: products.sizes, colours: products.colours, stock: products.stockStatus, status: products.status }).from(products).where(inArray(products.id, ids)) : [];
  const options = Object.fromEntries(rows.map((r) => [r.id, { sizes: r.sizes, colours: r.colours, available: r.stock !== "unavailable" && r.status === "published" }]));
  // Strip private fields (unitCost, supplierName) before responding
  return NextResponse.json({
    subtotal: q.subtotal, discount: q.discount, shipping: q.shipping, total: q.total, appliedCode: q.appliedCode, codeMessage: q.codeMessage,
    errors: [...new Set(q.errors)], multiSupplier: q.multiSupplier, mixedDelivery: q.mixedDelivery, options,
    items: q.items.map((i) => ({ productId: i.productId, size: i.size, colour: i.colour, unitPrice: i.unitPrice, quantity: i.quantity })),
  });
}
