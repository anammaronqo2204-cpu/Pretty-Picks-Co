"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

const rand = (i: number, s: number) => { const x = Math.sin(i * 9301 + s * 49297) * 233280; return x - Math.floor(x); };

export function Petals({ count = 14 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="petal" style={{ left: `${rand(i, 1) * 100}%`, width: 8 + rand(i, 2) * 8, height: 10 + rand(i, 3) * 8, borderRadius: "80% 0 80% 0", background: i % 3 ? "#e8a0b8" : "#ff3d8b", opacity: .8, animationDelay: `${-rand(i, 4) * 14}s`, ["--t" as string]: `${10 + rand(i, 5) * 10}s`, ["--dx" as string]: `${(rand(i, 6) - .3) * 160}px` }} />
      ))}
    </div>
  );
}

export function BlossomTree({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  const blooms = Array.from({ length: 46 }).map((_, i) => ({ x: 40 + rand(i, 7) * 220, y: 20 + rand(i, 8) * 130, r: 10 + rand(i, 9) * 18, c: ["#e8a0b8", "#ff3d8b", "#f7c6d8", "#d6246e"][i % 4] }));
  return (
    <svg aria-hidden viewBox="0 0 300 320" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <g className="sway">
        <path d="M150 320 C145 260 160 230 150 190 C140 160 110 140 80 120 M150 200 C170 170 200 150 240 130 M152 240 C130 220 100 210 60 200 M150 180 C150 140 165 110 170 70" stroke="#3b1f2e" strokeWidth="10" fill="none" strokeLinecap="round" />
        {blooms.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={.55 + rand(i, 10) * .35} />)}
        {blooms.slice(0, 18).map((b, i) => <circle key={"g" + i} cx={b.x + 3} cy={b.y - 3} r={2} fill="#fff4f8" opacity=".8" />)}
      </g>
    </svg>
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
  const moon = useRef<HTMLDivElement>(null), stars = useRef<HTMLDivElement>(null), trees = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0, ty = 0, sy = 0, raf = 0;
    const apply = () => {
      raf = 0;
      if (moon.current) moon.current.style.transform = `translate3d(${tx * 18}px, ${ty * 12 + sy * .25}px, 0)`;
      if (stars.current) stars.current.style.transform = `translate3d(${tx * 6}px, ${ty * 4 + sy * .1}px, 0)`;
      if (trees.current) trees.current.style.transform = `translate3d(${tx * -10}px, ${sy * -.08}px, 0)`;
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const onMove = (e: PointerEvent) => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; req(); };
    const onScroll = () => { sy = Math.min(scrollY, 800); req(); };
    const onTilt = (e: DeviceOrientationEvent) => { if (e.gamma == null || e.beta == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 45)) * .5; ty = Math.max(-1, Math.min(1, (e.beta - 45) / 45)) * .5; req(); };
    addEventListener("pointermove", onMove); addEventListener("scroll", onScroll, { passive: true }); addEventListener("deviceorientation", onTilt);
    return () => { removeEventListener("pointermove", onMove); removeEventListener("scroll", onScroll); removeEventListener("deviceorientation", onTilt); cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="relative min-h-[88vh] overflow-hidden flex items-center" style={{ background: "radial-gradient(ellipse at 70% 20%, #2a1230 0%, #0d0710 60%)" }}>
      <div ref={stars} aria-hidden className="absolute inset-0">
        {Array.from({ length: 70 }).map((_, i) => <span key={i} className="twinkle absolute rounded-full bg-cream" style={{ left: `${rand(i, 11) * 100}%`, top: `${rand(i, 12) * 75}%`, width: rand(i, 13) > .85 ? 3 : 1.5, height: rand(i, 13) > .85 ? 3 : 1.5, ["--d" as string]: `${2 + rand(i, 14) * 4}s`, animationDelay: `${rand(i, 15) * 4}s` }} />)}
        <span className="shooting absolute h-px w-28 bg-gradient-to-l from-transparent via-cream to-cream" style={{ top: "12%", left: "85%" }} />
        <span className="shooting absolute h-px w-20 bg-gradient-to-l from-transparent to-moon" style={{ top: "30%", left: "60%", animationDelay: "4.5s" }} />
      </div>
      <div ref={moon} aria-hidden className="absolute right-[-60px] top-[8%] sm:right-[8%]">
        <div className="moon rounded-full w-56 h-56 sm:w-80 sm:h-80" style={{ background: "radial-gradient(circle at 35% 35%, #ffe3ee, #e8a0b8 55%, #c56a8f)" }}>
          <span className="absolute rounded-full bg-[#d98aa8]/50 w-10 h-10 left-[30%] top-[40%]" /><span className="absolute rounded-full bg-[#d98aa8]/40 w-6 h-6 left-[60%] top-[25%]" /><span className="absolute rounded-full bg-[#d98aa8]/40 w-14 h-14 left-[55%] top-[60%]" />
        </div>
      </div>
      <div ref={trees} aria-hidden className="absolute inset-x-0 bottom-0 pointer-events-none">
        {/* Cherry blossom tree positioned on the right side so it never covers the hero text */}
        <BlossomTree flip className="absolute -right-12 sm:right-4 md:right-10 lg:right-16 bottom-0 w-80 sm:w-[28rem] lg:w-[34rem] opacity-95" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night to-transparent" />
      </div>
      <Petals count={16} />
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-24 w-full">
        <h1 className="font-script text-6xl sm:text-8xl leading-[1.1] text-cream fade-up" style={{ textShadow: "0 0 30px rgba(255,61,139,.55)" }}>Everything pretty,<br />one place.</h1>
        <p className="smallcaps mt-6 text-gold text-sm sm:text-base fade-up" style={{ animationDelay: ".2s" }}>✦ Curated for the Girlies ✦</p>
        <p className="mt-4 max-w-md text-cream/80 fade-up" style={{ animationDelay: ".3s" }}>Feminine fashion, accessories and trending finds – hand-picked, priced in Rand and delivered across South Africa.</p>
        <div className="mt-8 flex flex-wrap gap-3 fade-up" style={{ animationDelay: ".4s" }}>
          <Link href="/shop" className="btn btn-primary">Shop the Edit</Link>
          <Link href="/request" className="btn btn-ghost">Request an Item</Link>
        </div>
      </div>
    </section>
  );
}
