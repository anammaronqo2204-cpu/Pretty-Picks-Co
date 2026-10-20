"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { ProductImage } from "@/components/ProductImage";
import { useQuote } from "@/components/useQuote";
import { zar, deliveryText } from "@/lib/format";

export default function CartPage() {
  const { items, update, remove, ready } = useCart();
  const [codeInput, setCodeInput] = useState(""); const [code, setCode] = useState<string | null>(null);
  const { quote, loading } = useQuote(items, code, ready);
  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-cream/60">Loading your bag…</div>;
  if (!items.length) return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center"><p className="font-script text-6xl text-moon">Your bag is empty</p><p className="mt-3 text-cream/70">Let&apos;s fix that, gorgeous.</p><Link href="/shop" className="btn btn-primary mt-6">Shop the Edit</Link></div>
  );
  const blocked = !quote || quote.errors.length > 0;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="heading text-4xl mb-6">Your bag</h1>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-3">
          <p className="card p-4 text-sm border-gold/40">📦 Your items may arrive separately because products can come from different suppliers. Please check the estimated delivery time displayed on each product.</p>
          {quote?.mixedDelivery && <p role="alert" className="card p-4 text-sm border-bright/60 text-cream">⚠️ The items in your bag have <strong>different estimated delivery times</strong>, so they will likely arrive on different dates.</p>}
          {items.map((i) => {
            const opt = quote?.options[i.productId];
            return (
              <div key={i.key} className="card p-3 flex gap-3">
                <Link href={`/product/${i.slug}`} className="shrink-0"><ProductImage src={i.image} alt={i.title} className="w-24 h-24 rounded-xl" /></Link>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex justify-between gap-2"><Link href={`/product/${i.slug}`} className="font-medium hover:text-bright">{i.title}</Link><span className="price">{zar(i.price * i.quantity)}</span></div>
                  <p className="text-xs text-moon">Est. arrival: {deliveryText(i.deliveryMin, i.deliveryMax)}</p>
                  {opt && !opt.available && <p className="text-xs text-bright">No longer available – please remove.</p>}
                  <div className="flex flex-wrap gap-2 items-center">
                    {opt && opt.sizes.length > 0 && <select aria-label={`Size for ${i.title}`} className="input !min-h-10 !w-auto !py-1" value={i.size ?? ""} onChange={(e) => update(i.key, { size: e.target.value || null })}><option value="">Size</option>{opt.sizes.map((s) => <option key={s}>{s}</option>)}</select>}
                    {opt && opt.colours.length > 0 && <select aria-label={`Colour for ${i.title}`} className="input !min-h-10 !w-auto !py-1" value={i.colour ?? ""} onChange={(e) => update(i.key, { colour: e.target.value || null })}><option value="">Colour</option>{opt.colours.map((s) => <option key={s}>{s}</option>)}</select>}
                    <div className="flex items-center border border-moon/30 rounded-full">
                      <button aria-label="Decrease quantity" className="w-10 h-10" onClick={() => i.quantity > 1 ? update(i.key, { quantity: i.quantity - 1 }) : remove(i.key)}>−</button>
                      <span className="w-6 text-center">{i.quantity}</span>
                      <button aria-label="Increase quantity" className="w-10 h-10" onClick={() => update(i.key, { quantity: Math.min(10, i.quantity + 1) })}>+</button>
                    </div>
                    <button className="text-sm text-cream/60 underline hover:text-bright min-h-10" onClick={() => remove(i.key)}>Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <aside className="card p-5 h-fit lg:sticky lg:top-20 space-y-3" aria-busy={loading}>
          <h2 className="heading text-2xl">Summary</h2>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setCode(codeInput.trim() || null); }}>
            <label htmlFor="code" className="sr-only">Discount code</label>
            <input id="code" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Discount code" className="input uppercase" />
            <button className="btn btn-ghost shrink-0">Apply</button>
          </form>
          {quote?.codeMessage && <p className={`text-sm ${quote.appliedCode ? "text-gold" : "text-bright"}`} role="status">{quote.codeMessage}</p>}
          {quote && <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{zar(quote.subtotal)}</dd></div>
            {quote.discount > 0 && <div className="flex justify-between text-gold"><dt>Discount ({quote.appliedCode})</dt><dd>−{zar(quote.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{quote.shipping ? zar(quote.shipping) : "Free"}</dd></div>
            <div className="gold-line my-2" />
            <div className="flex justify-between text-lg"><dt>Total</dt><dd className="price">{zar(quote.total)}</dd></div>
          </dl>}
          {quote?.errors.map((e, k) => <p key={k} role="alert" className="text-sm text-bright">{e}</p>)}
          <Link href={blocked ? "#" : `/checkout${code ? `?code=${encodeURIComponent(code)}` : ""}`} aria-disabled={blocked} className={`btn btn-primary w-full ${blocked ? "pointer-events-none opacity-50" : ""}`}>Checkout</Link>
          <Link href="/shop" className="block text-center text-sm text-moon hover:text-bright">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
