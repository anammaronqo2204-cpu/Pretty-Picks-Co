"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { ProductImage } from "./ProductImage";
import { pixel } from "@/lib/pixel";
import { zar, deliveryText } from "@/lib/format";
import type { PublicProduct } from "@/lib/data";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0); const [zoom, setZoom] = useState(false); const [pos, setPos] = useState("50% 50%");
  const src = images[i];
  return (
    <div>
      <div className="relative card overflow-hidden aspect-square cursor-zoom-in" onClick={() => setZoom(!zoom)}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); }}
        onMouseLeave={() => setZoom(false)}>
        <div className="w-full h-full transition-transform duration-200" style={{ transform: zoom ? "scale(2)" : "none", transformOrigin: pos }}>
          <ProductImage src={src} alt={`${title}, image ${i + 1}`} className="w-full h-full" eager />
        </div>
        <button type="button" className="absolute bottom-3 right-3 badge bg-night/80 !py-2" aria-label={zoom ? "Zoom out" : "Zoom in"} onClick={(e) => { e.stopPropagation(); setZoom(!zoom); }}>{zoom ? "− Zoom" : "+ Zoom"}</button>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3">{images.map((im, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={`Show image ${k + 1}`} aria-current={k === i} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${k === i ? "border-bright" : "border-transparent"}`}><ProductImage src={im} alt="" className="w-full h-full" /></button>
        ))}</div>
      )}
    </div>
  );
}

export function ProductBuy({ p, whatsapp }: { p: PublicProduct; whatsapp: string }) {
  const { add, wishlist, toggleWish } = useCart();
  const router = useRouter();
  const [size, setSize] = useState<string | null>(p.sizes.length === 1 ? p.sizes[0] : null);
  const [colour, setColour] = useState<string | null>(p.colours.length === 1 ? p.colours[0] : null);
  const [qty, setQty] = useState(1); const [err, setErr] = useState("");
  const unavailable = p.stockStatus === "unavailable";
  useEffect(() => { pixel.viewContent({ id: p.id, title: p.title, price: Number(p.price) }); }, [p.id, p.title, p.price]);
  const doAdd = (e: React.MouseEvent, go = false) => {
    if (p.sizes.length && !size) return setErr("Please choose a size");
    if (p.colours.length && !colour) return setErr("Please choose a colour");
    setErr("");
    add({ productId: p.id, slug: p.slug, title: p.title, image: p.images[0] ?? "", price: Number(p.price), size, colour, deliveryMin: p.deliveryMin, deliveryMax: p.deliveryMax }, qty, { x: e.clientX, y: e.clientY });
    if (go) router.push("/checkout");
  };
  const wished = wishlist.includes(p.id);
  const Opt = ({ v, sel, on }: { v: string; sel: boolean; on: () => void }) => <button type="button" aria-pressed={sel} onClick={on} className={`min-h-11 min-w-11 px-3 rounded-full border text-sm transition ${sel ? "border-bright bg-bright/20 text-cream" : "border-moon/30 hover:border-moon"}`}>{v}</button>;
  return (
    <div className="space-y-5">
      {p.sizes.length > 0 && <fieldset><legend className="label">Size{size && <span className="text-cream">: {size}</span>}</legend><div className="flex flex-wrap gap-2">{p.sizes.map((s) => <Opt key={s} v={s} sel={size === s} on={() => setSize(s)} />)}</div></fieldset>}
      {p.colours.length > 0 && <fieldset><legend className="label">Colour{colour && <span className="text-cream">: {colour}</span>}</legend><div className="flex flex-wrap gap-2">{p.colours.map((c) => <Opt key={c} v={c} sel={colour === c} on={() => setColour(c)} />)}</div></fieldset>}
      <div className="flex items-center gap-3">
        <span className="label !mb-0">Qty</span>
        <div className="flex items-center border border-moon/30 rounded-full">
          <button type="button" aria-label="Decrease quantity" className="w-11 h-11" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span aria-live="polite" className="w-8 text-center">{qty}</span>
          <button type="button" aria-label="Increase quantity" className="w-11 h-11" onClick={() => setQty(Math.min(10, qty + 1))}>+</button>
        </div>
      </div>
      {err && <p role="alert" className="text-bright text-sm">{err}</p>}
      {unavailable ? <p className="card p-4 text-center">This item is currently unavailable. <a className="underline text-moon" href="/request">Request something similar</a></p> : (
        <div className="grid grid-cols-2 gap-3">
          <button className="btn btn-ghost" onClick={(e) => doAdd(e)}>Add to Cart</button>
          <button className="btn btn-primary" onClick={(e) => doAdd(e, true)}>Buy Now</button>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-ghost flex-1" aria-pressed={wished} onClick={() => toggleWish(p.id)}>{wished ? "♥ Saved" : "♡ Wishlist"}</button>
        <a className="btn flex-1 bg-[#25D366]/15 border border-[#25D366]/60 text-cream" target="_blank" rel="noopener noreferrer" onClick={() => pixel.contact()}
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I have a question about "${p.title}" (${zar(p.price)}).`)}`}>WhatsApp enquiry</a>
      </div>
      <p className="text-sm text-moon">Estimated arrival: <strong>{deliveryText(p.deliveryMin, p.deliveryMax)}</strong></p>
    </div>
  );
}
