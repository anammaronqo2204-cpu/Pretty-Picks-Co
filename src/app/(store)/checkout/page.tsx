"use client";
import Link from "next/link";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useQuote } from "@/components/useQuote";
import { zar, deliveryText } from "@/lib/format";
import { PROVINCES } from "@/lib/constants";
import { pixel } from "@/lib/pixel";

function F({ id, label, type = "text", req = true, auto, ...rest }: { id: string; label: string; type?: string; req?: boolean; auto?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div><label className="label" htmlFor={id}>{label}{req && " *"}</label><input id={id} name={id} type={type} required={req} autoComplete={auto} className="input" {...rest} /></div>;
}

function Checkout() {
  const { items, ready, clear } = useCart();
  const code = useSearchParams().get("code");
  const { quote } = useQuote(items, code, ready);
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const idem = useRef<string>("");
  const fired = useRef(false);
  useEffect(() => { idem.current = sessionStorage.getItem("ppc_idem") || crypto.randomUUID(); sessionStorage.setItem("ppc_idem", idem.current); }, []);
  useEffect(() => { if (quote && !fired.current && quote.items.length) { fired.current = true; pixel.initiateCheckout(quote.total, quote.items.length); } }, [quote]);

  if (ready && !items.length) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><p className="heading text-3xl">Your bag is empty</p><Link href="/shop" className="btn btn-primary mt-6">Shop</Link></div>;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (busy) return; setBusy(true); setErr("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, code, idempotencyKey: idem.current, lines: items.map((i) => ({ productId: i.productId, quantity: i.quantity, size: i.size, colour: i.colour })) }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not place order");
      sessionStorage.removeItem("ppc_idem"); clear();
      router.push(`/order/${d.reference}?t=${d.token}&new=1`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="heading text-4xl mb-6">Checkout</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <fieldset className="card p-5 space-y-4"><legend className="heading text-xl px-1">Your details</legend>
            <F id="customerName" label="Full name" auto="name" maxLength={100} />
            <div className="grid sm:grid-cols-2 gap-4"><F id="email" label="Email address" type="email" auto="email" /><F id="phone" label="Mobile number" type="tel" auto="tel" placeholder="082 123 4567" pattern="\+?[0-9 ()\-]{9,16}" title="Enter a valid SA mobile number" /></div>
          </fieldset>
          <fieldset className="card p-5 space-y-4"><legend className="heading text-xl px-1">Delivery address</legend>
            <F id="address" label="Street address" auto="street-address" maxLength={200} />
            <div className="grid sm:grid-cols-2 gap-4"><F id="suburb" label="Suburb" maxLength={80} /><F id="city" label="City or town" auto="address-level2" maxLength={80} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label" htmlFor="province">Province *</label><select id="province" name="province" required className="input" defaultValue=""><option value="" disabled>Choose…</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></div>
              <F id="postalCode" label="Postal code" auto="postal-code" inputMode="numeric" pattern="[0-9]{4}" title="4-digit postal code" />
            </div>
            <div><label className="label" htmlFor="instructions">Delivery instructions</label><textarea id="instructions" name="instructions" rows={2} maxLength={500} className="input" placeholder="Gate code, complex name…" /></div>
          </fieldset>
          <fieldset className="card p-5 space-y-3"><legend className="heading text-xl px-1">Payment method</legend>
            <label className="flex gap-3 items-start p-3 rounded-xl border border-bright/60 bg-bright/10"><input type="radio" name="paymentMethod" value="eft" defaultChecked className="mt-1.5 accent-[#ff3d8b]" /><span><strong>EFT / Bank transfer</strong><br /><span className="text-sm text-cream/70">You&apos;ll see our banking details and a unique reference after placing your order, then upload your proof of payment. Your order is confirmed once funds reflect in our account.</span></span></label>
            <p className="text-xs text-cream/50">Card payments (PayFast / Yoco) coming soon. We never store card details.</p>
          </fieldset>
        </div>
        <aside className="card p-5 h-fit lg:sticky lg:top-20 space-y-3">
          <h2 className="heading text-2xl">Order summary</h2>
          <ul className="space-y-2 text-sm">{items.map((i) => <li key={i.key} className="flex justify-between gap-2"><span>{i.quantity} × {i.title}{(i.size || i.colour) && <span className="text-cream/60"> ({[i.size, i.colour].filter(Boolean).join(", ")})</span>}<br /><span className="text-xs text-moon">Est. {deliveryText(i.deliveryMin, i.deliveryMax)}</span></span><span>{zar(i.price * i.quantity)}</span></li>)}</ul>
          {quote && <dl className="text-sm space-y-1 pt-2 border-t border-moon/10">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{zar(quote.subtotal)}</dd></div>
            {quote.discount > 0 && <div className="flex justify-between text-gold"><dt>Discount</dt><dd>−{zar(quote.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery fee</dt><dd>{quote.shipping ? zar(quote.shipping) : "Free"}</dd></div>
            <div className="flex justify-between text-lg pt-1"><dt>Amount payable</dt><dd className="price">{zar(quote.total)}</dd></div>
          </dl>}
          {quote?.multiSupplier && <p className="text-xs text-cream/70">Your items come from different suppliers and may arrive separately.</p>}
          {quote?.errors.map((e, k) => <p key={k} role="alert" className="text-sm text-bright">{e} <Link className="underline" href="/cart">Fix in cart</Link></p>)}
          <label className="flex gap-2 text-sm items-start"><input type="checkbox" name="terms" value="yes" required className="mt-1 w-5 h-5 accent-[#ff3d8b]" /><span>I accept the <Link href="/policies/terms" className="underline" target="_blank">Terms</Link>, <Link href="/policies/payment" className="underline" target="_blank">Payment Terms</Link>, <Link href="/policies/shipping" className="underline" target="_blank">Delivery</Link> and <Link href="/policies/returns" className="underline" target="_blank">Returns</Link> policies, and understand items are ordered from suppliers after payment is verified.</span></label>
          {err && <p role="alert" className="text-bright text-sm">{err}</p>}
          <button className="btn btn-primary w-full" disabled={busy || !quote || quote.errors.length > 0}>{busy ? "Placing order…" : `Place order${quote ? ` · ${zar(quote.total)}` : ""}`}</button>
        </aside>
      </form>
    </div>
  );
}
export default function Page() { return <Suspense><Checkout /></Suspense>; }
