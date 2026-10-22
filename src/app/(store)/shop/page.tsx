import Link from "next/link";
import { listProducts, getFacets, listCollections, hasSalesData, ShopFilters } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { BlossomBackdrop } from "@/components/Decor";
import { DELIVERY_BUCKETS } from "@/lib/constants";

export const metadata = { title: "Shop" };

export default async function Shop({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const f: ShopFilters = { q: sp.q, category: sp.category, collection: sp.collection, min: sp.min, max: sp.max, delivery: sp.delivery, size: sp.size, colour: sp.colour, availability: sp.availability, featured: sp.featured, newIn: sp.newIn, sort: sp.sort };
  const [items, facets, cols, sales] = await Promise.all([listProducts(f, 100), getFacets(), listCollections(), hasSalesData()]);
  const col = cols.find((c) => c.slug === f.collection);
  const title = col?.name ?? (f.newIn ? "New Arrivals" : f.q ? `Results for “${f.q}”` : "Shop the Edit");
  const active = Object.entries(f).filter(([k, v]) => v && k !== "sort").length;
  const Sel = ({ name, label, opts }: { name: keyof ShopFilters; label: string; opts: [string, string][] }) => (
    <div><label className="label" htmlFor={`f-${name}`}>{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={f[name] ?? ""} className="input"><option value="">All</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
  );
  return (
    <div className="relative">
      <div className="relative overflow-hidden h-48 sm:h-56 flex items-end" >
        <BlossomBackdrop strength="soft" />
        <div className="relative mx-auto max-w-6xl px-4 pb-6 w-full">
          <h1 className="heading text-4xl sm:text-5xl">{title}</h1>
          <p className="text-cream/70 mt-1">{col?.description ?? "Pretty things, hand-picked for you."}</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 mt-6 lg:grid lg:grid-cols-[240px_1fr] gap-8">
        <details className="card p-4 lg:open:block mb-6 lg:mb-0 self-start lg:sticky lg:top-20" open={active > 0 ? true : undefined}>
          <summary className="cursor-pointer font-medium min-h-11 flex items-center">Filters {active > 0 && <span className="ml-2 badge bg-bright">{active}</span>}</summary>
          <form method="get" action="/shop" className="space-y-3 mt-3">
            {f.q && <input type="hidden" name="q" value={f.q} />}
            <Sel name="category" label="Category" opts={facets.categories.map((c) => [c, c])} />
            <Sel name="collection" label="Collection" opts={cols.map((c) => [c.slug, c.name])} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label" htmlFor="f-min">Min (R)</label><input id="f-min" name="min" type="number" min={0} defaultValue={f.min} className="input" /></div>
              <div><label className="label" htmlFor="f-max">Max (R)</label><input id="f-max" name="max" type="number" min={0} defaultValue={f.max} className="input" /></div>
            </div>
            <Sel name="delivery" label="Delivery timeframe" opts={DELIVERY_BUCKETS.slice(0, 2).map((d) => [d.value, d.label])} />
            {facets.sizes.length > 0 && <Sel name="size" label="Size" opts={facets.sizes.map((s) => [s, s])} />}
            <Sel name="colour" label="Colour" opts={facets.colours.map((c) => [c, c])} />
            <Sel name="availability" label="Availability" opts={[["available", "Available to order"], ["local", "In stock locally"]]} />
            <label className="flex items-center gap-2 min-h-11"><input type="checkbox" name="featured" value="1" defaultChecked={!!f.featured} className="w-5 h-5 accent-[#ff3d8b]" /> Featured only</label>
            <label className="flex items-center gap-2 min-h-11"><input type="checkbox" name="newIn" value="1" defaultChecked={!!f.newIn} className="w-5 h-5 accent-[#ff3d8b]" /> New arrivals</label>
            <Sel name="sort" label="Sort by" opts={[["featured", "Featured"], ["newest", "Newest"], ["price-asc", "Price: Low to High"], ["price-desc", "Price: High to Low"], ...(sales ? [["popular", "Popularity"] as [string, string]] : [])]} />
            <button className="btn btn-primary w-full">Apply</button>
            <Link href="/shop" className="btn btn-ghost w-full">Clear all</Link>
          </form>
        </details>
        <div>
          <p className="text-sm text-cream/60 mb-4" aria-live="polite">{items.length} {items.length === 1 ? "pick" : "picks"}</p>
          {items.length === 0 ? (
            <div className="card p-10 text-center"><p className="heading text-2xl">No pretty matches… yet</p><p className="text-cream/70 mt-2">Try clearing filters, or ask us to source it for you.</p><div className="flex gap-3 justify-center mt-5"><Link href="/shop" className="btn btn-ghost">Clear filters</Link><Link href="/request" className="btn btn-primary">Request an Item</Link></div></div>
          ) : <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">{items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>}
        </div>
      </div>
    </div>
  );
}
