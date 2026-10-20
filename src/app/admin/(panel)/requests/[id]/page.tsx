import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { itemRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Flash } from "@/components/admin";
import { zar, suggestedPrice } from "@/lib/format";
import { REQUEST_STATUSES } from "@/lib/constants";
import { updateRequestAction } from "../../../actions";

export default async function RequestDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = Number((await params).id) || 0; const sp = await searchParams;
  const r = (await db.select().from(itemRequests).where(eq(itemRequests.id, id)).limit(1))[0];
  if (!r) notFound();
  const sugg = suggestedPrice(Number(r.supplierCost), Number(r.sourcingCost), Number(r.markupPercent));
  const quote = r.quotePrice ? Number(r.quotePrice) : sugg;
  const wa = r.whatsapp.replace(/\D/g, "").replace(/^0/, "27");
  const msg = r.quoteMessage || `Hi! 💗 Thanks for your Pretty Picks Co. request ${r.reference}. We found it! Your quote is ${zar(quote)} incl. sourcing (excl. delivery), estimated arrival X–Y days after payment. This quote is valid for 3 days. Reply YES to go ahead.`;
  return (
    <div className="space-y-6">
      <div><Link href="/admin/requests" className="text-sm text-moon">← Requests</Link><h1 className="heading text-3xl mt-1">Request <span className="text-gold">{r.reference}</span></h1><p className="text-sm text-cream/60">{r.createdAt.toLocaleString("en-ZA")} · {REQUEST_STATUSES[r.status]}</p></div>
      <Flash sp={sp} />
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="card p-5 space-y-2 text-sm">
          <h2 className="heading text-xl">Customer request</h2>
          <p className="whitespace-pre-line">{r.description}</p>
          <p>Colour: {r.colour || "—"} · Size: {r.size || "—"} · Budget: {r.budget ? zar(r.budget) : "—"}</p>
          {r.imageUrl && <p>Reference link: <a href={r.imageUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline text-moon break-all">{r.imageUrl}</a></p>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {r.imageMediaId && <a href={`/api/media/${r.imageMediaId}`} target="_blank"><img src={`/api/media/${r.imageMediaId}`} alt="Customer reference" className="max-h-60 rounded-xl" /></a>}
          {r.notes && <p className="text-cream/70">Notes: {r.notes}</p>}
          <p className="pt-2">📧 <a className="underline" href={`mailto:${r.email}?subject=${encodeURIComponent("Your Pretty Picks Co. request " + r.reference)}&body=${encodeURIComponent(msg)}`}>{r.email}</a></p>
          <p>💬 <a className="underline text-[#25D366]" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`}>{r.whatsapp} – send quote via WhatsApp</a></p>
          <h3 className="heading text-lg pt-3">Communication log</h3>
          <ol className="space-y-1">{r.log.map((l, i) => <li key={i} className="text-xs border-l-2 border-moon/30 pl-2"><span className="text-cream/50">{new Date(l.at).toLocaleString("en-ZA")}</span> – {l.text}</li>)}</ol>
        </section>
        <form action={updateRequestAction} className="card p-5 space-y-3">
          <input type="hidden" name="id" value={r.id} />
          <h2 className="heading text-xl">Research & quote 🔒</h2>
          <div><label className="label" htmlFor="status">Status</label><select id="status" name="status" defaultValue={r.status} className="input">{Object.entries(REQUEST_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="supplierName">Supplier</label><input id="supplierName" name="supplierName" defaultValue={r.supplierName} className="input" /></div>
            <div><label className="label" htmlFor="supplierUrl">Supplier URL</label><input id="supplierUrl" name="supplierUrl" defaultValue={r.supplierUrl} className="input" /></div>
            <div><label className="label" htmlFor="supplierCost">Supplier cost (R)</label><input id="supplierCost" name="supplierCost" type="number" step="0.01" min="0" defaultValue={r.supplierCost} className="input" /></div>
            <div><label className="label" htmlFor="sourcingCost">Sourcing costs (R)</label><input id="sourcingCost" name="sourcingCost" type="number" step="0.01" min="0" defaultValue={r.sourcingCost} className="input" /></div>
            <div><label className="label" htmlFor="markupPercent">Markup %</label><input id="markupPercent" name="markupPercent" type="number" min="0" defaultValue={r.markupPercent} className="input" /></div>
            <div><label className="label" htmlFor="quotePrice">Quote price (R)</label><input id="quotePrice" name="quotePrice" type="number" step="0.01" min="0" defaultValue={r.quotePrice ?? ""} placeholder={String(sugg)} className="input" /></div>
          </div>
          <p className="text-xs text-cream/60">Suggested (saved values): {zar(sugg)} · Margin at quote: {zar((quote - Number(r.supplierCost) - Number(r.sourcingCost)).toFixed(2))}</p>
          <div><label className="label" htmlFor="quoteMessage">Quote message to customer</label><textarea id="quoteMessage" name="quoteMessage" rows={4} defaultValue={msg} className="input" /></div>
          <div><label className="label" htmlFor="logNote">Add to communication log</label><input id="logNote" name="logNote" placeholder="e.g. Sent quote on WhatsApp" className="input" /></div>
          <button className="btn btn-primary w-full">Save</button>
          <p className="text-xs text-cream/50">When the customer accepts, create a product (status Draft/Published) and share the link, or record payment manually.</p>
        </form>
      </div>
    </div>
  );
}
