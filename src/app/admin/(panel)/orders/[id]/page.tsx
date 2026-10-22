import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems, paymentProofs, paymentEvents, products } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { Flash, th, td } from "@/components/admin";
import { zar, deliveryText } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_STATUSES, FULFILMENT_STEPS } from "@/lib/constants";
import { reviewProofAction, updateOrderAction, updateItemAction, verifyWithoutProofAction } from "../../../actions";

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = Number((await params).id) || 0; const sp = await searchParams;
  const o = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!o) notFound();
  const [items, proofs, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(paymentProofs).where(eq(paymentProofs.orderId, id)).orderBy(desc(paymentProofs.createdAt)),
    db.select().from(paymentEvents).where(eq(paymentEvents.orderId, id)).orderBy(desc(paymentEvents.createdAt)),
  ]);
  const pids = items.map((i) => i.productId).filter((x): x is number => !!x);
  const links = pids.length ? await db.select({ id: products.id, url: products.supplierUrl }).from(products).where(inArray(products.id, pids)) : [];
  const cost = items.reduce((s, i) => s + Number(i.unitCost) * i.quantity, 0);
  const itemRev = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
  const gp = itemRev - Number(o.discount) - cost - Number(o.transactionFee) - Number(o.refundAmount);
  const wa = o.phone.replace(/\D/g, "").replace(/^0/, "27");
  return (
    <div className="space-y-6">
      <div><Link href="/admin/orders" className="text-sm text-moon">← Orders</Link>
        <h1 className="heading text-3xl mt-1">Order <span className="text-gold">{o.reference}</span></h1>
        <p className="text-sm text-cream/60">Placed {o.createdAt.toLocaleString("en-ZA")} · Payment: <strong>{PAYMENT_STATUSES[o.paymentStatus]}</strong> · Status: <strong>{ORDER_STATUSES[o.status]}</strong></p>
      </div>
      <Flash sp={sp} />
      <div className="grid lg:grid-cols-3 gap-4">
        <section className="card p-5 text-sm space-y-1"><h2 className="heading text-xl mb-2">Customer</h2>
          <p>{o.customerName}</p><p><a className="underline" href={`mailto:${o.email}`}>{o.email}</a></p><p>{o.phone} · <a className="underline text-[#25D366]" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${o.customerName.split(" ")[0]}! Update on your Pretty Picks order ${o.reference}: `)}`}>WhatsApp</a></p>
          <p className="pt-2">{o.address}, {o.suburb}<br />{o.city}, {o.province}, {o.postalCode}</p>{o.instructions && <p className="text-cream/60">Note: {o.instructions}</p>}
        </section>
        <section className="card p-5 text-sm space-y-1"><h2 className="heading text-xl mb-2">Money</h2>
          <p className="flex justify-between"><span>Subtotal</span><span>{zar(o.subtotal)}</span></p>
          <p className="flex justify-between"><span>Discount {o.discountCode && `(${o.discountCode})`}</span><span>−{zar(o.discount)}</span></p>
          <p className="flex justify-between"><span>Delivery fee</span><span>{zar(o.shipping)}</span></p>
          <p className="flex justify-between font-medium"><span>Total (revenue)</span><span className="price">{zar(o.total)}</span></p>
          <p className="flex justify-between text-cream/60"><span>Product cost </span><span>{zar(cost)}</span></p>
          <p className="flex justify-between text-cream/60"><span>Transaction fee</span><span>{zar(o.transactionFee)}</span></p>
          <p className="flex justify-between text-cream/60"><span>Refunded</span><span>{zar(o.refundAmount)}</span></p>
          <p className="flex justify-between text-gold"><span>Est. gross profit</span><span>{zar(gp.toFixed(2))}</span></p>
        </section>
        <section className="card p-5 text-sm space-y-3 border-gold/40"><h2 className="heading text-xl">Payment verification</h2>
          <p className="text-xs text-cream/70">A screenshot/PDF is <strong>not</strong> proof that funds cleared. Check your bank account for {zar(o.total)} with reference {o.reference} before approving.</p>
          {proofs.length === 0 && <p className="text-cream/60">No proof uploaded yet.</p>}
          {proofs.map((p) => (
            <div key={p.id} className="rounded-xl border border-moon/20 p-3 space-y-2">
              <p><a href={`/api/media/${p.mediaId}`} target="_blank" className="underline text-moon">{p.fileName}</a> <span className="badge bg-moon/15">{p.status}</span></p>
              <p className="text-xs text-cream/50">{p.createdAt.toLocaleString("en-ZA")}{p.reviewNote && ` · ${p.reviewNote}`}</p>
              {p.status === "pending" && (
                <form action={reviewProofAction} className="space-y-2">
                  <input type="hidden" name="proofId" value={p.id} />
                  <input name="note" placeholder="Note (e.g. reason for rejection)" className="input !min-h-9 text-sm" />
                  <label className="flex gap-2 text-xs items-start"><input type="checkbox" name="fundsConfirmed" className="mt-0.5" /> I confirm {zar(o.total)} has cleared in the business bank account</label>
                  <div className="flex gap-2"><button name="decision" value="approve" className="btn btn-primary !min-h-9 !py-1 text-sm flex-1">Approve</button><button name="decision" value="reject" className="btn btn-ghost !min-h-9 !py-1 text-sm flex-1">Reject</button></div>
                </form>
              )}
            </div>
          ))}
          {o.paymentStatus !== "verified" && proofs.every((p) => p.status !== "pending") && (
            <form action={verifyWithoutProofAction} className="space-y-2 pt-2 border-t border-moon/10">
              <input type="hidden" name="orderId" value={o.id} />
              <label className="flex gap-2 text-xs items-start"><input type="checkbox" name="fundsConfirmed" className="mt-0.5" /> Funds cleared. Verify without proof</label>
              <button className="btn btn-ghost !min-h-9 !py-1 text-sm w-full">Mark payment verified</button>
            </form>
          )}
        </section>
      </div>

      <section className="card p-5 overflow-x-auto"><h2 className="heading text-xl mb-1">Items & fulfilment</h2>
        <p className="text-xs text-cream/60 mb-3">Track each item separately. Items from different suppliers ship separately. Supplier ordering is blocked until payment is verified.</p>
        <table className="w-full text-sm"><thead><tr>{["Item", "Supplier ", "Price / cost", "Est.", "Fulfilment step", "Supplier order ref", "Tracking", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>{items.map((i) => {
            const url = links.find((l) => l.id === i.productId)?.url;
            return (
              <tr key={i.id}>
                <td className={td}>{i.quantity} × {i.title}<br /><span className="text-xs text-cream/50">{[i.size, i.colour, i.variant].filter(Boolean).join(" · ")}</span></td>
                <td className={td}>{i.supplierName}{url && <><br /><a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline text-moon">listing ↗</a></>}</td>
                <td className={td}>{zar(i.unitPrice)} / {zar(i.unitCost)}</td>
                <td className={td}>{deliveryText(i.deliveryMin, i.deliveryMax)}</td>
                <td className={td} colSpan={4}>
                  <form action={updateItemAction} className="flex flex-wrap gap-2 items-center">
                    <input type="hidden" name="itemId" value={i.id} /><input type="hidden" name="orderId" value={o.id} />
                    <select name="fulfilmentStatus" defaultValue={i.fulfilmentStatus} aria-label="Fulfilment step" className="input !w-48 !min-h-9 !py-1 text-sm">{Object.entries(FULFILMENT_STEPS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                    <input name="supplierOrderRef" defaultValue={i.supplierOrderRef} placeholder="Supplier order #" aria-label="Supplier order reference" className="input !w-36 !min-h-9 !py-1 text-sm" />
                    <input name="trackingNumber" defaultValue={i.trackingNumber} placeholder="Tracking #" aria-label="Tracking number" className="input !w-36 !min-h-9 !py-1 text-sm" />
                    <button className="btn btn-ghost !min-h-9 !py-1 text-sm">Save</button>
                  </form>
                </td>
              </tr>
            );
          })}</tbody></table>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <form action={updateOrderAction} className="card p-5 space-y-3">
          <h2 className="heading text-xl">Order status, refunds & notes</h2>
          <input type="hidden" name="orderId" value={o.id} />
          <div><label className="label" htmlFor="status">Order status (customer-visible)</label><select id="status" name="status" defaultValue={o.status} className="input">{Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="label" htmlFor="paymentStatus">Payment status (separate from fulfilment)</label><select id="paymentStatus" name="paymentStatus" defaultValue={o.paymentStatus} className="input">{Object.entries(PAYMENT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="label" htmlFor="refundAmount">Refund amount (R)</label><input id="refundAmount" name="refundAmount" type="number" step="0.01" min="0" defaultValue={o.refundAmount} className="input" /></div>
          <div><label className="label" htmlFor="internalNotes">Internal notes </label><textarea id="internalNotes" name="internalNotes" rows={3} defaultValue={o.internalNotes} className="input" /></div>
          <button className="btn btn-primary w-full">Update order</button>
        </form>
        <section className="card p-5"><h2 className="heading text-xl mb-3">Payment audit trail</h2>
          <ol className="space-y-2 text-sm">{events.map((e) => <li key={e.id} className="border-l-2 border-moon/30 pl-3"><p><strong>{e.event.replace(/_/g, " ")}</strong> <span className="text-cream/50">by {e.actor}</span></p><p className="text-xs text-cream/60">{e.createdAt.toLocaleString("en-ZA")} · {e.detail}</p></li>)}</ol>
        </section>
      </div>
    </div>
  );
}
