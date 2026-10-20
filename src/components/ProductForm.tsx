"use client";
import { useState } from "react";
import { saveProductAction, uploadImageAction } from "@/app/admin/actions";
import { suggestedPrice, zar, slugify } from "@/lib/format";
import { CATEGORIES, STOCK_STATUSES } from "@/lib/constants";

type P = Record<string, unknown> & { id?: number };
export function ProductForm({ p, collections }: { p: P | null; collections: { slug: string; name: string }[] }) {
  const g = <T,>(k: string, d: T): T => ((p?.[k] as T) ?? d);
  const [cost, setCost] = useState(Number(g("supplierCost", 0)));
  const [src, setSrc] = useState(Number(g("sourcingCost", 0)));
  const [markup, setMarkup] = useState(Number(g("markupPercent", 100)));
  const [price, setPrice] = useState(String(g("price", "")));
  const [title, setTitle] = useState(String(g("title", "")));
  const [slug, setSlug] = useState(String(g("slug", "")));
  const [images, setImages] = useState(g<string[]>("images", []).join("\n"));
  const [upl, setUpl] = useState("");
  const sugg = suggestedPrice(cost, src, markup);
  const effPrice = Number(price) > 0 ? Number(price) : sugg;
  const profit = effPrice - cost - src;
  const sel = g<string[]>("collectionSlugs", []);
  const specs = Object.entries(g<Record<string, string>>("specs", {})).map(([k, v]) => `${k}: ${v}`).join("\n");
  const variants = g<{ name: string; priceAdjust?: number; available?: boolean }[]>("variants", []).map((v) => `${v.name}|${v.priceAdjust ?? 0}|${v.available === false ? "no" : "yes"}`).join("\n");
  const dt = g<Date | null>("publishAt", null);
  const L = ({ id, children }: { id: string; children: React.ReactNode }) => <label htmlFor={id} className="label">{children}</label>;
  return (
    <form action={saveProductAction} className="grid lg:grid-cols-[1fr_340px] gap-6">
      {p?.id && <input type="hidden" name="id" value={p.id} />}
      <div className="space-y-4">
        <section className="card p-5 space-y-4">
          <h2 className="heading text-xl">Public details</h2>
          <div><L id="title">Title *</L><input id="title" name="title" required value={title} onChange={(e) => { setTitle(e.target.value); if (!p?.id) setSlug(slugify(e.target.value)); }} className="input" /></div>
          <div><L id="slug">Slug (URL)</L><input id="slug" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="input" /></div>
          <div><L id="description">Description (only state what you have verified)</L><textarea id="description" name="description" rows={5} defaultValue={g("description", "")} className="input" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><L id="category">Category</L><input id="category" name="category" list="cats" defaultValue={g("category", "Accessories")} className="input" /><datalist id="cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></div>
            <div><L id="brand">Brand / style (only if verified)</L><input id="brand" name="brand" defaultValue={g("brand", "")} className="input" /></div>
            <div><L id="sizes">Sizes (comma separated)</L><input id="sizes" name="sizes" defaultValue={g<string[]>("sizes", []).join(", ")} className="input" placeholder="S, M, L" /></div>
            <div><L id="colours">Colours (comma separated)</L><input id="colours" name="colours" defaultValue={g<string[]>("colours", []).join(", ")} className="input" placeholder="Pink, Black" /></div>
          </div>
          <div><L id="variants">Other variations – one per line: name|price adjustment|yes/no available</L><textarea id="variants" name="variants" rows={2} defaultValue={variants} className="input" placeholder="With gift box|30|yes" /></div>
          <div><L id="specs">Specifications – one per line “Label: value”</L><textarea id="specs" name="specs" rows={3} defaultValue={specs} className="input" /></div>
          <fieldset><legend className="label">Collections</legend><div className="flex flex-wrap gap-3">{collections.map((c) => <label key={c.slug} className="flex items-center gap-2 text-sm"><input type="checkbox" name="collections" value={c.slug} defaultChecked={sel.includes(c.slug)} className="accent-[#ff3d8b] w-4 h-4" />{c.name}</label>)}</div></fieldset>
        </section>
        <section className="card p-5 space-y-3">
          <h2 className="heading text-xl">Photos</h2>
          <div><L id="images">Image URLs (one per line – first is main). Uploads are added automatically.</L><textarea id="images" name="images" rows={3} value={images} onChange={(e) => setImages(e.target.value)} className="input font-mono text-xs" /></div>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Upload product photo" className="input" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return; setUpl("Uploading…");
            const fd = new FormData(); fd.set("file", f); const r = await uploadImageAction(fd);
            if (r.url) { setImages((im) => (im ? im + "\n" : "") + r.url); setUpl("Uploaded ✓ (remember to save)"); } else setUpl(r.error ?? "Failed");
            e.target.value = "";
          }} />
          {upl && <p className="text-xs text-gold">{upl}</p>}
          <p className="text-xs text-cream/50">Compress photos (under ~300KB, ~1200px) for fast mobile loading. Only use images you have rights to.</p>
        </section>
        <section className="card p-5 space-y-3 border-gold/30">
          <h2 className="heading text-xl">🔒 Private (never shown to customers)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><L id="supplierName">Supplier name</L><input id="supplierName" name="supplierName" defaultValue={g("supplierName", "")} className="input" list="sups" /><datalist id="sups">{["SHEIN", "Temu", "Mr Price", "PEP", "Takealot"].map((s) => <option key={s} value={s} />)}</datalist></div>
            <div><L id="supplierUrl">Supplier product URL</L><input id="supplierUrl" name="supplierUrl" defaultValue={g("supplierUrl", "")} className="input" /></div>
          </div>
          <div><L id="internalNotes">Internal notes</L><textarea id="internalNotes" name="internalNotes" rows={3} defaultValue={g("internalNotes", "")} className="input" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDemo" defaultChecked={g("isDemo", false)} className="w-4 h-4" /> Demonstration product (shows a &quot;Demo&quot; label)</label>
        </section>
      </div>
      <aside className="space-y-4">
        <section className="card p-5 space-y-3">
          <h2 className="heading text-xl">Pricing</h2>
          <div><L id="supplierCost">Supplier cost (R) 🔒</L><input id="supplierCost" name="supplierCost" type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="input" /></div>
          <div><L id="sourcingCost">Extra sourcing costs (R) 🔒 – shipping, fees</L><input id="sourcingCost" name="sourcingCost" type="number" step="0.01" min="0" value={src} onChange={(e) => setSrc(Number(e.target.value))} className="input" /></div>
          <div><L id="markupPercent">Markup % 🔒</L><input id="markupPercent" name="markupPercent" type="number" step="1" min="0" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} className="input" /></div>
          <p className="text-sm">Suggested price: <strong className="price">{zar(sugg)}</strong> <button type="button" className="text-xs underline text-moon" onClick={() => setPrice(String(sugg))}>use</button></p>
          <p className="text-xs text-cream/50">= ({zar(cost)} + {zar(src)}) × (1 + {markup}/100)</p>
          <div><L id="price">Selling price (R) – leave blank to use suggested</L><input id="price" name="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="input" /></div>
          <div><L id="compareAtPrice">Original price for sale display (optional)</L><input id="compareAtPrice" name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={g("compareAtPrice", "") ?? ""} className="input" /></div>
          <p className={`text-sm ${profit < 0 ? "text-bright" : "text-gold"}`}>Margin per unit: {zar(profit.toFixed(2))} ({effPrice ? Math.round((profit / effPrice) * 100) : 0}%)</p>
        </section>
        <section className="card p-5 space-y-3">
          <h2 className="heading text-xl">Delivery & stock</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><L id="deliveryMin">Min days</L><input id="deliveryMin" name="deliveryMin" type="number" min="1" defaultValue={g("deliveryMin", 7)} className="input" /></div>
            <div><L id="deliveryMax">Max days</L><input id="deliveryMax" name="deliveryMax" type="number" min="1" defaultValue={g("deliveryMax", 14)} className="input" /></div>
          </div>
          <div><L id="stockStatus">Stock status</L><select id="stockStatus" name="stockStatus" defaultValue={g("stockStatus", "supplier")} className="input">{Object.entries(STOCK_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><p className="text-xs text-cream/50 mt-1">Only choose &quot;In stock locally&quot; if you physically hold it.</p></div>
        </section>
        <section className="card p-5 space-y-3">
          <h2 className="heading text-xl">Publishing</h2>
          <div><L id="status">Status</L><select id="status" name="status" defaultValue={g("status", "draft")} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
          <div><L id="publishAt">Scheduled publish (optional)</L><input id="publishAt" name="publishAt" type="datetime-local" defaultValue={dt ? new Date(dt).toISOString().slice(0, 16) : ""} className="input" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={g("featured", false)} className="w-4 h-4 accent-[#ff3d8b]" /> Featured</label>
          <button className="btn btn-primary w-full">Save product</button>
          {p?.id && <a href={`/product/${slug}?preview=1`} target="_blank" className="btn btn-ghost w-full">Preview ↗</a>}
        </section>
      </aside>
    </form>
  );
}
