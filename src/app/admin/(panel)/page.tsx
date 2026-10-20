import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems, itemRequests, paymentProofs } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Stat, th, td } from "@/components/admin";
import { zar } from "@/lib/format";
import { ensureSeed } from "@/lib/seed";

export default async function Dashboard() {
  await ensureSeed();
  const [totals] = await db.select({
    total: sql<number>`count(*)::int`,
    paid: sql<number>`count(*) filter (where ${orders.paymentStatus} in ('verified','refund_processing','refunded'))::int`,
    pending: sql<number>`count(*) filter (where ${orders.paymentStatus} in ('awaiting_proof','awaiting_verification','rejected') and ${orders.status} <> 'cancelled')::int`,
    toVerify: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'awaiting_verification')::int`,
    revenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.paymentStatus} in ('verified','refund_processing','refunded')),0)::float`,
    shipping: sql<number>`coalesce(sum(${orders.shipping}) filter (where ${orders.paymentStatus} in ('verified','refund_processing','refunded')),0)::float`,
    discounts: sql<number>`coalesce(sum(${orders.discount}) filter (where ${orders.paymentStatus} in ('verified','refund_processing','refunded')),0)::float`,
    fees: sql<number>`coalesce(sum(${orders.transactionFee}) filter (where ${orders.paymentStatus} in ('verified','refund_processing','refunded')),0)::float`,
    refunds: sql<number>`coalesce(sum(${orders.refundAmount}),0)::float`,
    refundCount: sql<number>`count(*) filter (where ${orders.paymentStatus} in ('refund_processing','refunded'))::int`,
  }).from(orders);
  const paidCond = sql`${orders.paymentStatus} in ('verified','refund_processing','refunded')`;
  const [items] = await db.select({
    revenue: sql<number>`coalesce(sum(${orderItems.unitPrice} * ${orderItems.quantity}),0)::float`,
    cost: sql<number>`coalesce(sum(${orderItems.unitCost} * ${orderItems.quantity}) filter (where ${orderItems.fulfilmentStatus} <> 'cancelled'),0)::float`,
  }).from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).where(paidCond);
  const best = await db.select({ title: orderItems.title, qty: sql<number>`sum(${orderItems.quantity})::int`, rev: sql<number>`sum(${orderItems.unitPrice} * ${orderItems.quantity})::float` })
    .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).where(paidCond).groupBy(orderItems.title).orderBy(desc(sql`sum(${orderItems.quantity})`)).limit(5);
  const monthly = await db.select({ m: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`, rev: sql<number>`sum(${orders.total})::float`, n: sql<number>`count(*)::int` })
    .from(orders).where(paidCond).groupBy(sql`1`).orderBy(desc(sql`1`)).limit(12);
  const [{ newReq }] = await db.select({ newReq: sql<number>`count(*)::int` }).from(itemRequests).where(eq(itemRequests.status, "new"));
  const [{ proofs }] = await db.select({ proofs: sql<number>`count(*)::int` }).from(paymentProofs).where(eq(paymentProofs.status, "pending"));

  const productRevenue = items.revenue - totals.discounts; // net of discounts, excl. shipping
  const grossProfit = productRevenue - items.cost - totals.fees - totals.refunds;
  const aov = totals.paid ? totals.revenue / totals.paid : 0;
  const maxM = Math.max(1, ...monthly.map((m) => m.rev));
  return (
    <div className="space-y-8">
      <h1 className="heading text-3xl">Dashboard</h1>
      {(totals.toVerify > 0 || newReq > 0) && (
        <div className="flex flex-wrap gap-3">
          {proofs > 0 && <Link href="/admin/orders?payment=awaiting_verification" className="btn btn-primary">{proofs} proof{proofs > 1 ? "s" : ""} to review</Link>}
          {newReq > 0 && <Link href="/admin/requests?status=new" className="btn btn-gold">{newReq} new request{newReq > 1 ? "s" : ""}</Link>}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total orders" value={totals.total} />
        <Stat label="Paid orders" value={totals.paid} hint="Payment verified" />
        <Stat label="Pending payments" value={totals.pending} hint={`${totals.toVerify} with proof uploaded`} />
        <Stat label="Average order value" value={zar(aov.toFixed(2))} hint="Paid orders, incl. delivery" />
        <Stat label="Revenue (total sales)" value={zar(totals.revenue.toFixed(2))} hint="Verified payments incl. delivery fees" />
        <Stat label="Product sourcing costs" value={zar(items.cost.toFixed(2))} hint="Supplier + sourcing cost snapshot" />
        <Stat label="Estimated gross profit" value={zar(grossProfit.toFixed(2))} hint="Product revenue − costs − fees − refunds" />
        <Stat label="Refunds" value={zar(totals.refunds.toFixed(2))} hint={`${totals.refundCount} orders`} />
      </div>
      <div className="card p-4 text-xs text-cream/70 space-y-1">
        <p><strong>Revenue</strong> = all money received for verified orders ({zar(totals.revenue.toFixed(2))}), including delivery fees ({zar(totals.shipping.toFixed(2))}).</p>
        <p><strong>Gross profit</strong> = product revenue after discounts ({zar(productRevenue.toFixed(2))}) − product cost & attributable sourcing ({zar(items.cost.toFixed(2))}) − transaction fees ({zar(totals.fees.toFixed(2))}) − refunds ({zar(totals.refunds.toFixed(2))}). Delivery fees and your courier costs are excluded.</p>
        <p><strong>Net profit</strong> is not calculated here – it also requires your operating expenses (courier costs, ads, packaging, data, tax), which aren&apos;t recorded in this system.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5"><h2 className="heading text-xl mb-3">Sales by month (revenue)</h2>
          {monthly.length === 0 ? <p className="text-sm text-cream/60">No verified sales yet.</p> : <ul className="space-y-2">{monthly.map((m) => <li key={m.m} className="text-sm"><div className="flex justify-between"><span>{m.m}</span><span className="price">{zar(m.rev.toFixed(2))} · {m.n} orders</span></div><div className="h-2 rounded bg-moon/10 mt-1"><div className="h-2 rounded bg-gradient-to-r from-blossom to-bright" style={{ width: `${(m.rev / maxM) * 100}%` }} /></div></li>)}</ul>}
        </section>
        <section className="card p-5"><h2 className="heading text-xl mb-3">Best-selling products</h2>
          {best.length === 0 ? <p className="text-sm text-cream/60">No verified sales yet.</p> : <table className="w-full text-sm"><thead><tr><th className={th}>Product</th><th className={th}>Units</th><th className={th}>Revenue</th></tr></thead><tbody>{best.map((b) => <tr key={b.title}><td className={td}>{b.title}</td><td className={td}>{b.qty}</td><td className={td}>{zar(b.rev.toFixed(2))}</td></tr>)}</tbody></table>}
        </section>
      </div>
    </div>
  );
}
