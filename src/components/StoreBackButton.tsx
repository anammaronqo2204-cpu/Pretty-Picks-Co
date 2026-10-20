"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Entry = { url: string; scrollY: number };
const STACK_KEY = "ppc_store_history";
const RESTORE_KEY = "ppc_store_restore";
const MAX = 30;

const read = (): Entry[] => { try { return JSON.parse(sessionStorage.getItem(STACK_KEY) || "[]"); } catch { return []; } };
const write = (s: Entry[]) => { try { sessionStorage.setItem(STACK_KEY, JSON.stringify(s.slice(-MAX))); } catch {} };

/** Keeps a stack of visited store pages with scroll positions so Back returns to the exact spot. */
export function StoreBackButton() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const [prev, setPrev] = useState<Entry | null>(null);
  const url = pathname + (sp.toString() ? `?${sp}` : "");

  // Hide on the home page and checkout/order flows where "back" would be confusing.
  const hidden = pathname === "/" || pathname.startsWith("/checkout") || pathname.startsWith("/order/");

  useEffect(() => {
    const stack = read();
    const restore = sessionStorage.getItem(RESTORE_KEY);
    const top = stack[stack.length - 1];
    if (restore) {
      // We arrived via our Back button: restore the saved scroll position once content is painted.
      sessionStorage.removeItem(RESTORE_KEY);
      const target = Number(restore) || 0;
      let tries = 0;
      const attempt = () => {
        window.scrollTo({ top: target, behavior: "auto" });
        if (Math.abs(window.scrollY - target) > 4 && tries++ < 12) requestAnimationFrame(attempt);
      };
      requestAnimationFrame(attempt);
    } else if (!top || top.url !== url) {
      // Normal forward navigation: push a fresh entry for this page.
      stack.push({ url, scrollY: 0 });
      write(stack);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrev(() => { const s = read(); return s.length >= 2 ? s[s.length - 2] : null; });

    // Continuously remember where the customer is on this page.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const s = read();
        const i = s.length - 1;
        if (i >= 0 && s[i].url === url) { s[i].scrollY = window.scrollY; write(s); }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [url]);

  if (hidden || !prev) return null;

  const goBack = () => {
    const s = read();
    s.pop(); // leave the current page
    const target = s[s.length - 1];
    write(s);
    if (!target) { router.push("/shop"); return; }
    sessionStorage.setItem(RESTORE_KEY, String(target.scrollY));
    router.push(target.url, { scroll: false });
  };

  const label = prev.url.startsWith("/shop") ? "Back to shop" : prev.url.startsWith("/product/") ? "Back to product" : prev.url === "/" ? "Back to home" : "Back";
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <button type="button" onClick={goBack} className="btn btn-ghost !min-h-10 !py-1.5 text-sm" aria-label={`${label} – returns to where you were`}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        {label}
      </button>
    </div>
  );
}
