"use client";
import { useMemo, useRef, useState } from "react";
import { unzipSync } from "fflate";
import Link from "next/link";
import { parseProductFilename, isImageName } from "@/lib/filename-parse";
import { SUPPLIER_PRESETS, CATEGORIES, STOCK_STATUSES } from "@/lib/constants";
import { zar } from "@/lib/format";

type Row = { name: string; title: string; price: string; include: boolean; warning?: string };
type Result = { created: { id: number; title: string; price: number; slug: string }[]; skipped: { file: string; reason: string }[]; errors: { file: string; reason: string }[]; deliveryMin: number; deliveryMax: number; supplierName: string };

const MAX_ZIP = 25 * 1024 * 1024;

export function BulkUpload({ collections }: { collections: { slug: string; name: string }[] }) {
  const [zip, setZip] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [readErr, setReadErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [supplier, setSupplier] = useState("SHEIN");
  const [eta, setEta] = useState({ min: 10, max: 18 });
  const fileRef = useRef<HTMLInputElement>(null);

  const included = rows.filter((r) => r.include);
  const ready = included.length > 0 && included.every((r) => r.title.trim().length > 1 && Number(r.price) > 0);

  const onPick = async (f: File | null) => {
    setReadErr(""); setErr(""); setResult(null); setRows([]); setZip(null);
    if (!f) return;
    if (!/\.zip$/i.test(f.name)) { setReadErr("Please choose a .zip file."); return; }
    if (f.size > MAX_ZIP) { setReadErr(`That ZIP is ${(f.size / 1048576).toFixed(1)}MB. Max 25MB. Compress your photos first.`); return; }
    try {
      const entries = unzipSync(new Uint8Array(await f.arrayBuffer()), {
        filter: (e) => !e.name.endsWith("/") && !e.name.startsWith("__MACOSX/") && isImageName(e.name.split("/").pop() ?? ""),
      });
      const names = Object.keys(entries);
      if (!names.length) { setReadErr("No JPG, PNG, WebP or GIF images found in that ZIP."); return; }
      if (names.length > 100) { setReadErr(`That ZIP has ${names.length} images. Import 100 at a time.`); return; }
      setRows(names.map((name) => { const p = parseProductFilename(name); return { name, title: p.title, price: p.price ? String(p.price) : "", include: true, warning: p.warning }; }));
      setZip(f);
    } catch {
      setReadErr("That file isn't a readable ZIP.");
    }
  };

  const groupSummary = useMemo(() => {
    const withPrice = rows.filter((r) => Number(r.price) > 0);
    const total = withPrice.reduce((s, r) => s + Number(r.price), 0);
    return { count: rows.length, withPrice: withPrice.length, total };
  }, [rows]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!zip) return;
    setBusy(true); setErr(""); setResult(null);
    const form = new FormData(e.currentTarget);
    form.set("zip", zip);
    form.set("overrides", JSON.stringify(Object.fromEntries(rows.map((r) => [r.name, { title: r.title, price: Number(r.price) || undefined, include: r.include }]))));
    try {
      const res = await fetch("/api/admin/bulk-import", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Import failed (HTTP ${res.status}).`);
      setResult(data);
      setRows([]); setZip(null); if (fileRef.current) fileRef.current.value = "";
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const patch = (name: string, v: Partial<Row>) => setRows((rs) => rs.map((r) => (r.name === name ? { ...r, ...v } : r)));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="heading text-3xl">Bulk upload from ZIP</h1>
        <p className="text-sm text-cream/70 mt-1">Name each photo like <code className="text-gold">Pink Y2K bag - R250.jpg</code>. We read the name and price from the filename, then create one product per photo with your supplier and delivery estimate.</p>
      </div>

      <section className="card p-5 border-gold/30 text-sm">
        <h2 className="heading text-xl text-gold">Filename rules</h2>
        <ul className="mt-2 space-y-1 list-disc pl-5 text-cream/80">
          <li><code>Pink Y2K bag - R250.jpg</code> → “Pink Y2K bag”, R250</li>
          <li><code>Rose Gold Set - R1 250,00.png</code> → “Rose Gold Set”, R1 250</li>
          <li><code>R179 Heart Necklace.webp</code> → “Heart Necklace”, R179</li>
          <li>No price in the name? The row is flagged and you can type the price below.</li>
        </ul>
        <p className="mt-2 text-xs text-cream/60">Keep photos under 5MB each, max 100 per ZIP, 25MB total. Uploaded photos are stored privately and shown only after you publish the product.</p>
      </section>

      <form onSubmit={submit} className="space-y-5">
        <section className="card p-5 space-y-3">
          <label className="label" htmlFor="zip">1. Choose your ZIP</label>
          <input ref={fileRef} id="zip" name="zipFile" type="file" accept=".zip,application/zip,application/x-zip-compressed" className="input file:mr-3 file:rounded-full file:border-0 file:bg-moon file:px-3 file:text-night" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
          {readErr && <p role="alert" className="text-bright text-sm">{readErr}</p>}
          {zip && <p className="text-sm text-gold">{zip.name} · {(zip.size / 1048576).toFixed(1)}MB · {rows.length} images read</p>}
        </section>

        {rows.length > 0 && (
          <section className="card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="heading text-xl">2. Check names & prices</h2>
              <div className="flex gap-3 text-xs">
                <button type="button" className="underline" onClick={() => setRows((rs) => rs.map((r) => ({ ...r, include: true })))}>Select all</button>
                <button type="button" className="underline" onClick={() => setRows((rs) => rs.map((r) => ({ ...r, include: false })))}>Deselect all</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-cream/50"><th className="py-2 pr-2">Use</th><th className="py-2 pr-2">File</th><th className="py-2 pr-2">Product name</th><th className="py-2 pr-2 w-32">Price (R)</th></tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.name} className={r.include ? "" : "opacity-40"}>
                    <td className="py-1 pr-2"><input type="checkbox" checked={r.include} onChange={(e) => patch(r.name, { include: e.target.checked })} aria-label={`Import ${r.name}`} className="w-5 h-5 accent-[#ff3d8b]" /></td>
                    <td className="py-1 pr-2 text-xs text-cream/60 max-w-44 truncate" title={r.name}>{r.name}</td>
                    <td className="py-1 pr-2"><input value={r.title} onChange={(e) => patch(r.name, { title: e.target.value })} aria-label={`Name for ${r.name}`} className="input !min-h-9 !py-1" maxLength={120} />{r.warning && !Number(r.price) && <span className="text-[11px] text-bright">{r.warning}</span>}</td>
                    <td className="py-1 pr-2"><input value={r.price} onChange={(e) => patch(r.name, { price: e.target.value.replace(/[^\d.]/g, "") })} aria-label={`Price for ${r.name}`} inputMode="decimal" placeholder="0" className="input !min-h-9 !py-1" /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <p className="text-xs text-cream/60">{groupSummary.withPrice} of {groupSummary.count} have a price · total value {zar(groupSummary.total)}</p>
          </section>
        )}

        <section className="card p-5 grid sm:grid-cols-2 gap-4">
          <h2 className="heading text-xl sm:col-span-2">3. Apply to everything in this ZIP</h2>
          <div>
            <label className="label" htmlFor="supplier">Supplier</label>
            <select id="supplier" name="supplier" value={supplier} className="input" onChange={(e) => { const s = e.target.value; setSupplier(s); const p = SUPPLIER_PRESETS.find((x) => x.name === s); if (p) setEta({ min: p.deliveryMin, max: p.deliveryMax }); }}>
              {SUPPLIER_PRESETS.map((s) => <option key={s.name}>{s.name}</option>)}
            </select>
            <p className="text-[11px] text-cream/50 mt-1">Supplier is private. Customers never see it.</p>
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" name="category" className="input" defaultValue="Accessories">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label" htmlFor="deliveryMin">ETA from (days)</label><input id="deliveryMin" name="deliveryMin" type="number" min={1} value={eta.min} onChange={(e) => setEta((v) => ({ ...v, min: Number(e.target.value) }))} className="input" /></div>
            <div><label className="label" htmlFor="deliveryMax">ETA to (days)</label><input id="deliveryMax" name="deliveryMax" type="number" min={1} value={eta.max} onChange={(e) => setEta((v) => ({ ...v, max: Number(e.target.value) }))} className="input" /></div>
          </div>
          <div>
            <label className="label" htmlFor="status">Publish state</label>
            <select id="status" name="status" className="input" defaultValue="draft"><option value="draft">Draft: finish descriptions first</option><option value="published">Publish immediately</option></select>
          </div>
          <div>
            <label className="label" htmlFor="stockStatus">Stock status</label>
            <select id="stockStatus" name="stockStatus" className="input" defaultValue="supplier">{Object.entries(STOCK_STATUSES).filter(([k]) => k !== "local").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          <fieldset className="sm:col-span-2"><legend className="label">Add to collections</legend>
            <div className="flex flex-wrap gap-3">{collections.map((c) => <label key={c.slug} className="flex items-center gap-2 text-sm"><input type="checkbox" name="collections" value={c.slug} className="w-4 h-4 accent-[#ff3d8b]" />{c.name}</label>)}</div>
          </fieldset>
          <div className="sm:col-span-2"><label className="label" htmlFor="description">Shared description (optional, you can edit each product later)</label><textarea id="description" name="description" rows={2} maxLength={2000} className="input" placeholder="e.g. Sourced to order from our supplier. Please allow the stated delivery time." /></div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" name="skipExisting" value="1" defaultChecked className="w-4 h-4 accent-[#ff3d8b]" /> Skip photos whose product name already exists</label>
        </section>

        {err && <p role="alert" className="card p-3 text-bright border-bright/50 text-sm">{err}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" disabled={!zip || !ready || busy}>{busy ? "Importing…" : `Import ${included.length || ""} product${included.length === 1 ? "" : "s"}`}</button>
          {rows.length > 0 && !ready && <span className="text-sm text-bright">Every selected photo needs a name and a price.</span>}
          <Link href="/admin/products" className="btn btn-ghost">Back to products</Link>
        </div>
      </form>

      {result && (
        <section className="card p-5 space-y-3 border-gold/40 fade-up" role="status">
          <h2 className="heading text-2xl text-gold">Imported {result.created.length} product{result.created.length === 1 ? "" : "s"}</h2>
          <p className="text-sm text-cream/70">Supplier: {result.supplierName} · Estimated arrival: {result.deliveryMin} to {result.deliveryMax} days · Status: {rows.length ? "" : "as chosen"}</p>
          {result.created.length > 0 && <ul className="text-sm space-y-1 max-h-64 overflow-auto">{result.created.map((c) => <li key={c.id} className="flex justify-between gap-3"><Link href={`/admin/products/${c.id}`} className="underline text-moon">{c.title}</Link><span className="price">{zar(c.price)}</span></li>)}</ul>}
          {[...result.skipped, ...result.errors].length > 0 && (
            <details><summary className="cursor-pointer text-sm text-cream/70">{result.skipped.length + result.errors.length} skipped or needing attention</summary>
              <ul className="text-xs mt-2 space-y-1 text-cream/70">{[...result.skipped, ...result.errors].map((s, i) => <li key={i}>{s.file}: {s.reason}</li>)}</ul>
            </details>
          )}
          <div className="flex gap-2 pt-1"><Link href="/admin/products" className="btn btn-primary">Review products</Link><button type="button" className="btn btn-ghost" onClick={() => setResult(null)}>Import another ZIP</button></div>
        </section>
      )}
    </div>
  );
}
