import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, listProducts, getPublicSettings } from "@/lib/data";
import { getAdmin } from "@/lib/auth";
import { Gallery, ProductBuy } from "@/components/ProductBuy";
import { ProductCard } from "@/components/ProductCard";
import { zar, deliveryText } from "@/lib/format";
import { STOCK_STATUSES } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProductBySlug((await params).slug);
  return { title: p?.title ?? "Product", description: p?.description.slice(0, 150) };
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params; const { preview } = await searchParams;
  const isPreview = preview === "1" && !!(await getAdmin());
  const p = await getProductBySlug(slug, isPreview);
  if (!p) notFound();
  const [s, related] = await Promise.all([getPublicSettings(), listProducts({ category: p.category }, 5)]);
  const onSale = p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price);
  const stockColour = p.stockStatus === "local" ? "bg-gold text-night" : p.stockStatus === "unavailable" ? "bg-black/60" : p.stockStatus === "low" ? "bg-bright/80" : "bg-moon/20 text-moon";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {isPreview && <p className="card p-3 mb-4 text-gold text-sm">Admin preview – this product may not be published.</p>}
      <nav aria-label="Breadcrumb" className="text-sm text-cream/60 mb-4"><Link href="/shop" className="hover:text-bright">Shop</Link> / <Link href={`/shop?category=${encodeURIComponent(p.category)}`} className="hover:text-bright">{p.category}</Link></nav>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <Gallery images={p.images.length ? p.images : [""]} title={p.title} />
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`badge ${stockColour}`}>{STOCK_STATUSES[p.stockStatus] ?? p.stockStatus}</span>
            {p.isDemo && <span className="badge bg-black/60">Demonstration product</span>}
          </div>
          <h1 className="heading text-3xl sm:text-4xl">{p.title}</h1>
          {p.brand && <p className="text-sm text-cream/60 mt-1">Style: {p.brand}</p>}
          <div className="flex items-baseline gap-3 mt-3"><span className="price text-2xl">{zar(p.price)}</span>{onSale && <s className="text-cream/50">{zar(p.compareAtPrice)}</s>}</div>
          <div className="card p-4 mt-5 border-gold/40">
            <p className="font-medium text-gold">Estimated arrival: {deliveryText(p.deliveryMin, p.deliveryMax)}</p>
            <p className="text-sm text-cream/75 mt-1">
              {p.stockStatus === "local" ? "This item is held locally, so it ships sooner once payment is verified." : "This item is sourced to order: we place your order with our supplier after your payment has been confirmed. The estimate counts from payment verification."}
            </p>
            <p className="text-xs text-cream/60 mt-2">If your cart contains items from different suppliers, they may arrive separately. <Link href="/policies/shipping" className="underline">Delivery info</Link></p>
          </div>
          <div className="mt-6"><ProductBuy p={p} whatsapp={s.whatsapp} /></div>
          <div className="mt-8">
            <h2 className="heading text-xl text-moon">Description</h2>
            <p className="mt-2 text-cream/85 whitespace-pre-line">{p.description}</p>
            {Object.keys(p.specs).length > 0 && (<>
              <h2 className="heading text-xl text-moon mt-6">Specifications</h2>
              <dl className="mt-2 divide-y divide-moon/10 text-sm">{Object.entries(p.specs).map(([k, v]) => <div key={k} className="flex justify-between py-2 gap-4"><dt className="text-cream/60">{k}</dt><dd className="text-right">{v}</dd></div>)}</dl>
            </>)}
            <h2 className="heading text-xl text-moon mt-6">Delivery information</h2>
            <ul className="mt-2 text-sm text-cream/80 list-disc pl-5 space-y-1">
              <li>Flat delivery fee of {zar(s.shippingFee)} within South Africa; free over {zar(s.freeShippingOver)}.</li>
              <li>Pay by EFT. We order from the supplier only after funds are verified.</li>
              <li>Report damaged, defective or incorrect items within 7 days – see our <Link className="underline" href="/policies/returns">returns policy</Link>.</li>
            </ul>
          </div>
        </div>
      </div>
      {related.filter((r) => r.id !== p.id).length > 0 && (
        <section className="mt-16"><h2 className="heading text-3xl mb-6">You might also love</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">{related.filter((r) => r.id !== p.id).slice(0, 4).map((r, i) => <ProductCard key={r.id} p={r} index={i} />)}</div>
        </section>
      )}
    </div>
  );
}
