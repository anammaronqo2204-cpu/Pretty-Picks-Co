"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { consentDecided, initPixel, pixel, setConsent, PIXEL_ID } from "@/lib/pixel";

const NAV = [["Home", "/"], ["Shop", "/shop"], ["New Arrivals", "/shop?newIn=1&sort=newest"], ["Request an Item", "/request"], ["Track Order", "/track"]];

export function Header() {
  const { count, wishlist } = useCart();
  const [open, setOpen] = useState(false), [search, setSearch] = useState(false), [q, setQ] = useState("");
  const router = useRouter(); const path = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(false); setSearch(false); }, [path]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`/shop?q=${encodeURIComponent(q.trim())}`); };
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-night/80 border-b border-moon/10">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-3 focus:bg-blossom">Skip to content</a>
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-3">
        <button className="lg:hidden w-11 h-11 grid place-items-center" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? "M5 5l14 14M19 5L5 19" : "M3 6h18M3 12h18M3 18h18"} /></svg>
        </button>
        <Link href="/" className="font-script text-3xl sm:text-4xl text-cream whitespace-nowrap" style={{ textShadow: "0 0 18px rgba(255,61,139,.5)" }}>Pretty Picks <span className="text-moon">Co.</span></Link>
        <nav aria-label="Main" className="hidden lg:flex gap-6 ml-8 text-sm">
          {NAV.map(([l, h]) => <Link key={h} href={h} className={`hover:text-bright transition ${path === h ? "text-bright" : ""}`}>{l}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button aria-label="Search" className="w-11 h-11 grid place-items-center hover:text-bright" onClick={() => setSearch(!search)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="7" /><path d="M15 15l5 5" /></svg>
          </button>
          <Link href="/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} className="relative w-11 h-11 hidden sm:grid place-items-center hover:text-bright">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0118 9c0 5.5-7 10-7 10z" /></svg>
            {wishlist.length > 0 && <span className="absolute top-1 right-1 text-[10px] bg-moon text-night rounded-full w-4 h-4 grid place-items-center">{wishlist.length}</span>}
          </Link>
          <Link href="/cart" aria-label={`Cart, ${count} items`} className="relative w-11 h-11 grid place-items-center hover:text-bright">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 7h12l-1 12H6L5 7z" /><path d="M8 7a3 3 0 016 0" /></svg>
            {count > 0 && <span className="absolute top-0.5 right-0.5 text-[11px] bg-bright text-white rounded-full min-w-5 h-5 px-1 grid place-items-center">{count}</span>}
          </Link>
        </div>
      </div>
      {search && (
        <form onSubmit={submit} role="search" className="mx-auto max-w-6xl px-4 pb-3">
          <label htmlFor="site-search" className="sr-only">Search products</label>
          <input id="site-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="Search bags, bows, jewellery…" />
        </form>
      )}
      {open && (
        <nav aria-label="Mobile" className="lg:hidden border-t border-moon/10 bg-night px-4 py-3 flex flex-col">
          {[...NAV, ["Wishlist", "/wishlist"], ["About", "/about"], ["Contact", "/contact"]].map(([l, h]) => <Link key={h} href={h} className="py-3 text-lg border-b border-moon/5">{l}</Link>)}
        </nav>
      )}
    </header>
  );
}

export function WhatsAppFloat({ number }: { number: string }) {
  const path = usePathname();
  if (path.startsWith("/checkout")) return null;
  return (
    <a href={`https://wa.me/${number}?text=${encodeURIComponent("Hi Pretty Picks Co.! 💗")}`} target="_blank" rel="noopener noreferrer" onClick={() => pixel.contact()} aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] grid place-items-center shadow-[0_0_24px_rgba(37,211,102,.45)] hover:scale-105 transition">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.2.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" /></svg>
    </a>
  );
}

function PageViews() {
  const path = usePathname(); const sp = useSearchParams();
  useEffect(() => { initPixel(); pixel.pageView(path + (sp.toString() ? "?" + sp : "")); }, [path, sp]);
  return null;
}

export function ConsentAndPixel() {
  const [show, setShow] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setShow(!consentDecided()); }, []);
  return (
    <>
      <Suspense fallback={null}><PageViews /></Suspense>
      {show && (
        <div role="dialog" aria-label="Cookie consent" className="fixed bottom-0 inset-x-0 z-[60] p-4">
          <div className="card mx-auto max-w-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center text-sm">
            <p className="flex-1">We use essential storage for your cart. {PIXEL_ID ? "With your OK, we also use the Meta Pixel to measure our ads." : "Optional analytics are currently off."} <Link href="/policies/cookies" className="underline text-moon">Cookie notice</Link></p>
            <div className="flex gap-2">
              <button className="btn btn-ghost !min-h-10 !py-1" onClick={() => { setConsent(false); setShow(false); }}>Essential only</button>
              <button className="btn btn-primary !min-h-10 !py-1" onClick={() => { setConsent(true); setShow(false); pixel.pageView(location.pathname + "#consent"); }}>Accept</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
