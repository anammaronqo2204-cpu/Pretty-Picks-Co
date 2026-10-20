import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems, paymentProofs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { safeEqual } from "@/lib/security";
import { getSettings } from "@/lib/data";
import { zar, deliveryText } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { ProofUpload, PurchasePixel, CopyButton } from "@/components/OrderClient";

export const metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ t?: string; new?: string }> }) {
  const { ref } = await params; const { t = "", new: isNew } = await searchParams;
  const o = (await db.select().from(orders).where(eq(orders.reference, ref.toUpperCase())).limit(1))[0];
  if (!o || !safeEqual(o.accessToken, t)) notFound();
  const [items, proofs, s] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
    db.select({ status: paymentProofs.status, createdAt: paymentProofs.createdAt, fileName: paymentProofs.fileName, note: paymentProofs.reviewNote }).from(paymentProofs).where(eq(paymentProofs.orderId, o.id)).orderBy(desc(paymentProofs.createdAt)),
    getSettings(),
  ]);
  const b = s.bank;
  const bankReady = b.verified && b.accountNumber;
  const canUpload = ["awaiting_proof", "rejected", "awaiting_verification"].includes(o.paymentStatus) && o.status !== "cancelled";
  const suppliers = new Set(items.map((i) => `${i.deliveryMin}-${i.deliveryMax}`));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      {o.paymentStatus === "verified" && <PurchasePixel reference={o.reference} total={Number(o.total)} />}
      <div className="text-center">
        {isNew && <p className="font-script text-5xl sm:text-6xl text-moon">Thank you, {o.customerName.split(" ")[0]}!</p>}
        <h1 className="heading text-3xl mt-2">Order <span className="text-gold">{o.reference}</span></h1>
        <p className="mt-2">Status: <strong className="text-bright">{ORDER_STATUSES[o.status]}</strong> · Payment: {PAYMENT_STATUSES[o.paymentStatus]}</p>
        <p className="text-sm text-cream/60 mt-1">Bookmark this page – it&apos;s your private link to this order. You can also <Link href="/track" className="underline">track it</Link> with your order number and email.</p>
      </div>

      {o.paymentMethod === "eft" && o.paymentStatus !== "verified" && o.status !== "cancelled" && (
        <section className="card p-6 border-gold/40" aria-labelledby="eft-h">
          <h2 id="eft-h" className="heading text-2xl">Pay by EFT</h2>
          <p className="mt-1 text-cream/80">Please pay <strong className="price">{zar(o.total)}</strong> using the reference <strong className="text-gold">{o.reference}</strong><CopyButton text={o.reference} />.</p>
          {bankReady ? (
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-cream/60">Bank</dt><dd>{b.bankName}</dd>
              <dt className="text-cream/60">Account name</dt><dd>{b.accountName}</dd>
              <dt className="text-cream/60">Account number</dt><dd>{b.accountNumber}<CopyButton text={b.accountNumber} /></dd>
              <dt className="text-cream/60">Branch code</dt><dd>{b.branchCode}</dd>
              <dt className="text-cream/60">Account type</dt><dd>{b.accountType}</dd>
              <dt className="text-cream/60">Reference</dt><dd className="text-gold">{o.reference}</dd>
            </dl>
          ) : <p className="mt-4 p-3 rounded-xl bg-bright/10 text-sm">Our banking details are being finalised. Please contact us on <a className="underline" href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hi! Banking details for order " + o.reference + " please")}`}>WhatsApp</a> before paying.</p>}
          <ul className="mt-4 text-sm text-cream/75 list-disc pl-5 space-y-1">
            <li>Uploading proof of payment helps us match your payment, but your order is only confirmed once the funds reflect in our account (usually 1–3 business days between banks).</li>
            <li>We place your order with our suppliers only after payment is verified. Delivery estimates count from that point.</li>
          </ul>
          {canUpload && <div className="mt-5"><ProofUpload reference={o.reference} token={o.accessToken} /></div>}
          {proofs.length > 0 && <ul className="mt-4 text-xs text-cream/70 space-y-1">{proofs.map((p, k) => <li key={k}>📎 {p.fileName} – {p.status === "pending" ? "awaiting review" : p.status}{p.note && p.status === "rejected" ? ` (${p.note})` : ""}</li>)}</ul>}
        </section>
      )}
      {o.paymentStatus === "verified" && <p className="card p-4 text-center text-gold">💗 Payment verified – thank you! We&apos;re ordering your items from our suppliers.</p>}

      <section className="card p-6">
        <h2 className="heading text-2xl mb-3">Order summary</h2>
        <ul className="divide-y divide-moon/10">{items.map((i) => (
          <li key={i.id} className="py-3 flex justify-between gap-3 text-sm">
            <span>{i.quantity} × {i.title}{(i.size || i.colour) && <span className="text-cream/60"> ({[i.size, i.colour].filter(Boolean).join(", ")})</span>}<br /><span className="text-moon text-xs">Estimated arrival: {deliveryText(i.deliveryMin, i.deliveryMax)} after payment verification</span>{i.trackingNumber && <><br /><span className="text-xs">Tracking: <span className="text-gold">{i.trackingNumber}</span></span></>}</span>
            <span>{zar(Number(i.unitPrice) * i.quantity)}</span>
          </li>))}</ul>
        <dl className="text-sm space-y-1 mt-3 pt-3 border-t border-moon/10">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{zar(o.subtotal)}</dd></div>
          {Number(o.discount) > 0 && <div className="flex justify-between text-gold"><dt>Discount ({o.discountCode})</dt><dd>−{zar(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{Number(o.shipping) ? zar(o.shipping) : "Free"}</dd></div>
          <div className="flex justify-between text-lg"><dt>Total</dt><dd className="price">{zar(o.total)}</dd></div>
        </dl>
        {suppliers.size > 1 && <p className="text-xs text-cream/70 mt-3">Your items have different delivery estimates and may arrive separately.</p>}
        <p className="text-sm text-cream/70 mt-4">Delivering to: {o.customerName}, {o.address}, {o.suburb}, {o.city}, {o.province}, {o.postalCode}</p>
      </section>
    </div>
  );
}
