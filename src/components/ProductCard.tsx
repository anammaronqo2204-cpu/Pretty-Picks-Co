"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { ProductImage } from "./ProductImage";
import { zar, deliveryText } from "@/lib/format";
import type { PublicProduct } from "@/lib/data";

export function ProductCard({ p, index = 0 }: { p: PublicProduct; index?: number }) {
  const { add, wishlist, toggleWish } = useCart();
  const wished = wishlist.includes(p.id);
  const quickAdd = p.sizes.length <= 1 && p.colours.length <= 1 && p.stockStatus !== "unavailable";
  const onSale = p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price);
  return (
    <article className="group card overflow-hidden fade-up flex flex-col" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <div className="relative">
        <Link href={`/product/${p.slug}`} aria-label={p.title}>
          <ProductImage src={p.images[0]} alt={p.title} className="aspect-square transition-transform duration-500 group-hover:scale-105" eager={index < 4} />
        </Link>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {onSale && <span className="badge bg-bright text-white">Sale</span>}
          {p.stockStatus === "local" && <span className="badge bg-gold text-night">Local stock</span>}
          {p.stockStatus === "unavailable" && <span className="badge bg-black/70">Unavailable</span>}
          {p.isDemo && <span className="badge bg-black/60 text-cream/80">Demo</span>}
        </div>
        <button onClick={() => toggleWish(p.id)} aria-pressed={wished} aria-label={wished ? `Remove ${p.title} from wishlist` : `Add ${p.title} to wishlist`} className="absolute top-2 right-2 w-10 h-10 rounded-full bg-night/70 grid place-items-center hover:scale-110 transition">
          <svg width="20" height="20" viewBox="0 0 22 22" fill={wished ? "#ff3d8b" : "none"} stroke="#ff3d8b" strokeWidth="2"><path d="M11 19s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0118 9c0 5.5-7 10-7 10z" /></svg>
        </button>
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-1 flex-1">
        <Link href={`/product/${p.slug}`} className="font-medium leading-snug hover:text-bright">{p.title}</Link>
        <div className="flex items-baseline gap-2"><span className="price">{zar(p.price)}</span>{onSale && <s className="text-sm text-cream/50">{zar(p.compareAtPrice)}</s>}</div>
        <p className="text-xs text-moon">Est. arrival: {deliveryText(p.deliveryMin, p.deliveryMax)}</p>
        {(p.sizes.length > 0 || p.colours.length > 0) && <p className="text-xs text-cream/60 truncate">{[p.sizes.length ? `Sizes ${p.sizes.join(", ")}` : "", p.colours.length > 1 ? `${p.colours.length} colours` : p.colours[0] ?? ""].filter(Boolean).join(" · ")}</p>}
        <div className="mt-auto pt-2">
          {quickAdd ? (
            <button className="btn btn-primary w-full !min-h-10 !py-1.5 text-sm" onClick={(e) => add({ productId: p.id, slug: p.slug, title: p.title, image: p.images[0] ?? "", price: Number(p.price), size: p.sizes[0] ?? null, colour: p.colours[0] ?? null, deliveryMin: p.deliveryMin, deliveryMax: p.deliveryMax }, 1, { x: e.clientX, y: e.clientY })}>Quick add</button>
          ) : (
            <Link href={`/product/${p.slug}`} className={`btn btn-ghost w-full !min-h-10 !py-1.5 text-sm ${p.stockStatus === "unavailable" ? "opacity-60" : ""}`}>{p.stockStatus === "unavailable" ? "View" : "Choose options"}</Link>
          )}
        </div>
      </div>
    </article>
  );
}
