"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

/** Soft blossom photo used as a quiet backdrop on the right side of a section. */
export function BlossomBackdrop({ className = "", strength = "normal" }: { className?: string; strength?: "soft" | "normal" }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-y-0 right-0 w-full md:w-3/5 ${className}`}>
      <Image
        src="/images/blossoms.jpg"
        alt=""
        fill
        sizes="(min-width: 768px) 60vw, 100vw"
        className={`object-cover object-[70%_center] ${strength === "soft" ? "opacity-30" : "opacity-60 md:opacity-90"}`}
        style={{ maskImage: "linear-gradient(to right, transparent 0%, #000 45%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 45%)" }}
      />
    </div>
  );
}

export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { rootMargin: "0px 0px -40px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

export function Hero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden flex items-center bg-night">
      <div aria-hidden className="absolute inset-y-0 right-0 w-full md:w-[62%]">
        <Image
          src="/images/pink-moon.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 62vw, 100vw"
          className="object-cover object-[70%_center] opacity-60 md:opacity-100"
          style={{ maskImage: "linear-gradient(to right, transparent 0%, #000 40%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 40%)" }}
        />
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night to-transparent" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-24 w-full">
        <h1 className="font-script text-6xl sm:text-8xl leading-[1.1] text-cream fade-up">Everything pretty,<br />one place.</h1>
        <p className="smallcaps mt-6 text-gold text-sm sm:text-base fade-up" style={{ animationDelay: ".2s" }}>Curated for the Girlies</p>
        <p className="mt-4 max-w-md text-cream/80 fade-up" style={{ animationDelay: ".3s" }}>Feminine fashion, accessories and trending finds. Hand-picked, priced in Rand and delivered across South Africa.</p>
        <div className="mt-8 flex flex-wrap gap-3 fade-up" style={{ animationDelay: ".4s" }}>
          <Link href="/shop" className="btn btn-primary">Shop the Edit</Link>
          <Link href="/request" className="btn btn-ghost">Request an Item</Link>
        </div>
      </div>
    </section>
  );
}
