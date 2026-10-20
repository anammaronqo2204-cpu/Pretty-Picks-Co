"use client";
import { useState } from "react";
import Link from "next/link";
import { zar } from "@/lib/format";

async function post(url: string, body: unknown | FormData) {
  const res = await fetch(url, body instanceof FormData ? { method: "POST", body } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong – please try again.");
  return data;
}
const Honeypot = () => <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />;

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | string>("idle");
  return state === "ok" ? <p className="text-moon text-sm" role="status">You&apos;re on the list, gorgeous 💌</p> : (
    <form className={`flex gap-2 ${compact ? "" : "max-w-md mx-auto"}`} onSubmit={async (e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); setState("busy");
      try { await post("/api/newsletter", Object.fromEntries(fd)); setState("ok"); } catch (err) { setState((err as Error).message); }
    }}>
      <label className="sr-only" htmlFor={`nl-${compact}`}>Email address</label>
      <Honeypot />
      <input id={`nl-${compact}`} name="email" type="email" required placeholder="Your email" className="input" />
      <button className="btn btn-primary shrink-0" disabled={state === "busy"}>Join</button>
      {state !== "idle" && state !== "busy" && <p role="alert" className="text-bright text-xs">{state}</p>}
    </form>
  );
}

export function ContactForm() {
  const [state, setState] = useState<"idle" | "busy" | "ok" | string>("idle");
  if (state === "ok") return <div className="card p-6" role="status"><p className="heading text-2xl text-moon">Message sent 💗</p><p className="mt-2">We usually reply within 1–2 business days.</p></div>;
  return (
    <form className="card p-6 space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setState("busy");
      try { await post("/api/contact", Object.fromEntries(new FormData(e.currentTarget))); setState("ok"); } catch (err) { setState((err as Error).message); }
    }}>
      <Honeypot />
      <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" name="name" required className="input" maxLength={100} /></div>
      <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" required className="input" /></div>
      <div><label className="label" htmlFor="c-phone">Phone (optional)</label><input id="c-phone" name="phone" className="input" /></div>
      <div><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" name="body" required rows={5} maxLength={2000} className="input" /></div>
      {state !== "idle" && state !== "busy" && <p role="alert" className="text-bright text-sm">{state}</p>}
      <button className="btn btn-primary w-full" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Send message"}</button>
    </form>
  );
}

export function RequestForm() {
  const [state, setState] = useState<"idle" | "busy" | string>("idle");
  const [ref, setRef] = useState<string | null>(null);
  if (ref) return (
    <div className="card p-8 text-center" role="status">
      <p className="font-script text-5xl text-moon">Request received!</p>
      <p className="mt-4">Your request reference is <strong className="price text-xl">{ref}</strong></p>
      <p className="mt-3 text-cream/80">We&apos;ll research it with our suppliers and contact you on WhatsApp or email with a quote. <strong>Nothing is confirmed and you pay nothing until you accept a quote.</strong></p>
      <Link href="/shop" className="btn btn-ghost mt-6">Keep browsing</Link>
    </div>
  );
  return (
    <form className="card p-6 sm:p-8 space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setState("busy");
      try { const d = await post("/api/requests", new FormData(e.currentTarget)); setRef(d.reference); } catch (err) { setState((err as Error).message); }
    }}>
      <Honeypot />
      <div><label className="label" htmlFor="r-desc">Product name or description *</label><textarea id="r-desc" name="description" required minLength={5} maxLength={1500} rows={3} className="input" placeholder="e.g. Pink satin corset top with lace trim I saw on TikTok" /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="label" htmlFor="r-url">Reference image or link</label><input id="r-url" name="imageUrl" type="url" className="input" placeholder="https://…" /></div>
        <div><label className="label" htmlFor="r-img">…or upload a photo (JPG/PNG/WebP, max 5MB)</label><input id="r-img" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input file:mr-3 file:rounded-full file:border-0 file:bg-moon file:px-3 file:text-night" /></div>
        <div><label className="label" htmlFor="r-col">Preferred colour</label><input id="r-col" name="colour" className="input" maxLength={60} /></div>
        <div><label className="label" htmlFor="r-size">Preferred size</label><input id="r-size" name="size" className="input" maxLength={30} /></div>
        <div><label className="label" htmlFor="r-budget">Maximum budget (R)</label><input id="r-budget" name="budget" type="number" min={0} step="1" className="input" /></div>
        <div><label className="label" htmlFor="r-wa">WhatsApp number *</label><input id="r-wa" name="whatsapp" type="tel" required className="input" placeholder="+27 82 123 4567" /></div>
      </div>
      <div><label className="label" htmlFor="r-email">Email address *</label><input id="r-email" name="email" type="email" required className="input" /></div>
      <div><label className="label" htmlFor="r-notes">Additional notes</label><textarea id="r-notes" name="notes" rows={3} maxLength={1500} className="input" /></div>
      <label className="flex gap-2 text-sm items-start"><input type="checkbox" required className="mt-1 accent-[#ff3d8b]" /> I agree that Pretty Picks Co. may contact me about this request (see <Link href="/policies/privacy" className="underline">Privacy Policy</Link>).</label>
      {state !== "idle" && state !== "busy" && <p role="alert" className="text-bright text-sm">{state}</p>}
      <button className="btn btn-primary w-full" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Send my request"}</button>
    </form>
  );
}

type TrackResult = { reference: string; status: string; paymentStatus: string; createdAt: string; total: string; items: { title: string; quantity: number; status: string; trackingNumber: string; delivery: string }[]; link?: string };
export function TrackForm() {
  const [state, setState] = useState<"idle" | "busy" | string>("idle");
  const [res, setRes] = useState<TrackResult | null>(null);
  return (
    <div className="space-y-6">
      <form className="card p-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end" onSubmit={async (e) => {
        e.preventDefault(); setState("busy"); setRes(null);
        try { setRes(await post("/api/track", Object.fromEntries(new FormData(e.currentTarget)))); setState("idle"); } catch (err) { setState((err as Error).message); }
      }}>
        <div><label className="label" htmlFor="t-ref">Order number</label><input id="t-ref" name="reference" required className="input uppercase" placeholder="PP-XXXXXX" /></div>
        <div><label className="label" htmlFor="t-email">Email used at checkout</label><input id="t-email" name="email" type="email" required className="input" /></div>
        <button className="btn btn-primary" disabled={state === "busy"}>{state === "busy" ? "Checking…" : "Track"}</button>
      </form>
      {state !== "idle" && state !== "busy" && <p role="alert" className="text-bright">{state}</p>}
      {res && (
        <div className="card p-6 fade-up">
          <div className="flex flex-wrap justify-between gap-2"><p className="heading text-2xl">Order {res.reference}</p><span className="price">{zar(res.total)}</span></div>
          <p className="mt-2">Status: <strong className="text-bright">{res.status}</strong></p>
          <p className="text-sm text-cream/70">Payment: {res.paymentStatus} · Placed {new Date(res.createdAt).toLocaleDateString("en-ZA")}</p>
          <ul className="mt-4 divide-y divide-moon/10">
            {res.items.map((i, k) => <li key={k} className="py-3 text-sm"><p className="font-medium">{i.quantity} × {i.title}</p><p className="text-cream/70">{i.status} · Est. arrival {i.delivery}{i.trackingNumber && <> · Tracking: <span className="text-gold">{i.trackingNumber}</span></>}</p></li>)}
          </ul>
          {res.link && <Link href={res.link} className="btn btn-ghost mt-4">View order & upload proof of payment</Link>}
        </div>
      )}
    </div>
  );
}
