import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { and, asc, desc, eq, ilike, inArray, or, SQL } from "drizzle-orm";
import { th, td } from "@/components/admin";
import { zar, deliveryText } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";

export default async function Orders({ searchParams }: { searchParams: Promise<{ q?: string; payment?: string; status?: string; sort?: string }> }) {
  const sp = await searchParams;
  const c: (SQL | undefined)[] = [];
  if (sp.q) c.push(or(ilike(orders.reference, `%${sp.q}%`), ilike(orders.customerName, `%${sp.q}%`), ilike(orders.email, `%${sp.q}%`), ilike(orders.phone, `%${sp.q}%`)));
  if (sp.payment) c.push(eq(orders.paymentStatus, sp.payment));
  if (sp.status) c.push(eq(orders.status, sp.status));
  const sort = sp.sort === "oldest" ? asc(orders.createdAt) : sp.sort === "total" ? desc(orders.total) : desc(orders.createdAt);
  const rows = await db.select().from(orders).where(c.length ? and(...c) : undefined).orderBy(sort).limit(200);
  const items = rows.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id))) : [];
  return (
    <div>
      <h1 className="heading text-3xl mb-4">Orders</h1>
      <form className="flex flex-wrap gap-2 mb-4">
        <input name="q" defaultValue={sp.q} placeholder="Ref, name, email, phone" className="input !w-60" />
        <select name="payment" defaultValue={sp.payment ?? ""} className="input !w-52"><option value="">All payments</option>{Object.entries(PAYMENT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} className="input !w-52"><option value="">All statuses</option>{Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="sort" defaultValue={sp.sort ?? ""} className="input !w-36"><option value="">Newest</option><option value="oldest">Oldest</option><option value="total">Highest total</option></select>
        <button className="btn btn-ghost">Apply</button>
      </form>
      <div className="card overflow-x-auto"><table className="w-full text-sm">
        <thead><tr>{["Order", "Customer", "Date", "Items", "Payment", "Status", "Total", "Supplier(s)", "Tracking", "Est. delivery", "Notes"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((o) => {
          const its = items.filter((i) => i.orderId === o.id);
          const sup = [...new Set(its.map((i) => i.supplierName))].join(", ");
          const trk = its.map((i) => i.trackingNumber).filter(Boolean).join(", ");
          const dmin = Math.min(...its.map((i) => i.deliveryMin)), dmax = Math.max(...its.map((i) => i.deliveryMax));
          return (
            <tr key={o.id}>
              <td className={td}><Link href={`/admin/orders/${o.id}`} className="text-gold font-medium hover:underline">{o.reference}</Link></td>
              <td className={td}>{o.customerName}<br /><span className="text-xs text-cream/50">{o.email}</span></td>
              <td className={td}>{o.createdAt.toLocaleDateString("en-ZA")}</td>
              <td className={td}>{its.reduce((s, i) => s + i.quantity, 0)}</td>
              <td className={td}><span className={`badge ${o.paymentStatus === "verified" ? "bg-gold/20 text-gold" : o.paymentStatus === "awaiting_verification" ? "bg-bright/30" : "bg-moon/15"}`}>{PAYMENT_STATUSES[o.paymentStatus]}</span></td>
              <td className={td}>{ORDER_STATUSES[o.status]}</td>
              <td className={td}>{zar(o.total)}</td>
              <td className={td}>{sup}</td><td className={td}>{trk || "-"}</td>
              <td className={td}>{its.length ? deliveryText(dmin, dmax) : "-"}</td>
              <td className={`${td} max-w-40 truncate text-cream/60`}>{o.internalNotes}</td>
            </tr>
          );
        })}</tbody>
      </table>{rows.length === 0 && <p className="p-6 text-center text-cream/60">No orders yet.</p>}</div>
    </div>
  );
}
