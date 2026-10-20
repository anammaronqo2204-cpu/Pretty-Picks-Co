import Link from "next/link";
import { Hero, BlossomTree, Petals, Reveal } from "@/components/Decor";
import { ProductCard } from "@/components/ProductCard";
import { NewsletterForm } from "@/components/Forms";
import { ProductImage } from "@/components/ProductImage";
import { listProducts, listCollections, getPublicSettings, hasSalesData, PublicProduct } from "@/lib/data";

function Section({ title, sub, href, items }: { title: string; sub?: string; href: string; items: PublicProduct[] }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 mt-20">
      <Reveal className="flex items-end justify-between gap-4 mb-6">
        <div><h2 className="heading text-3xl sm:text-4xl">{title}</h2>{sub && <p className="text-cream/70 mt-1">{sub}</p>}</div>
        <Link href={href} className="text-sm text-moon hover:text-bright whitespace-nowrap">View all →</Link>
      </Reveal>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">{items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>
    </section>
  );
}

const SWATCH = ["#ff3d8b", "#e8a0b8", "#d6246e", "#d4af37", "#c9a8ff", "#f6b3c9"];

export default async function Home() {
  const [cols, newest, trending, sales, s] = await Promise.all([
    listCollections(), listProducts({ sort: "newest" }, 4), listProducts({ collection: "trending-now" }, 4), hasSalesData(), getPublicSettings(),
  ]);
  const best = sales ? await listProducts({ sort: "popular" }, 4) : await listProducts({ featured: "1" }, 4);
  const social = await listProducts({}, 6);
  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 -mt-6 relative z-10">
        <Reveal className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[["🔒", "Secure payment options", "EFT to our business account, verified by hand"], ["🗓️", "Clear delivery estimates", "Every product shows its own arrival range"], ["✨", "Carefully curated finds", "Hand-picked, not an endless marketplace"], ["💌", "Personal sourcing service", "Ask us to find that item you saw online"]].map(([i, t, d]) => (
            <div key={t} className="card p-4 text-center"><div className="text-2xl" aria-hidden>{i}</div><p className="text-sm font-medium mt-1">{t}</p><p className="text-xs text-cream/60 mt-1">{d}</p></div>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-20">
        <Reveal><h2 className="heading text-3xl sm:text-4xl text-center">Shop the collections</h2><p className="text-center text-cream/70 mt-2">Find your aesthetic</p></Reveal>
        <div className="mt-8 flex gap-3 overflow-x-auto pb-3 snap-x sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
          {cols.map((c, i) => (
            <Link key={c.id} href={`/shop?collection=${c.slug}`} className="snap-start shrink-0 w-44 sm:w-auto card p-5 min-h-36 flex flex-col justify-end relative overflow-hidden group hover:border-bright/50 transition">
              <span aria-hidden className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-30 group-hover:opacity-60 transition blur-xl" style={{ background: SWATCH[i % SWATCH.length] }} />
              <p className="heading text-lg leading-tight relative">{c.name}</p>
              <p className="text-xs text-cream/60 mt-1 relative">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <Section title="New arrivals" sub="Fresh picks, just landed on the site" href="/shop?newIn=1&sort=newest" items={newest} />
      <Section title="Trending now" sub="What the girlies are loving" href="/shop?collection=trending-now" items={trending} />
      <Section title={sales ? "Bestsellers" : "Our featured favourites"} sub={sales ? "Most-ordered pieces" : "Bestsellers will appear here once we have real sales data"} href={sales ? "/shop?sort=popular" : "/shop?featured=1"} items={best} />

      <section className="relative mt-24 overflow-hidden">
        <Petals count={12} />
        <BlossomTree className="absolute -right-10 bottom-0 w-64 sm:w-96 opacity-70" flip />
        <div className="relative mx-auto max-w-6xl px-4 py-16">
          <Reveal className="card p-8 sm:p-12 max-w-2xl" >
            <p className="smallcaps text-gold text-sm">Personal sourcing</p>
            <h2 className="heading text-3xl sm:text-5xl mt-2">Saw it online? <span className="text-bright">We&apos;ll find it.</span></h2>
            <p className="mt-4 text-cream/80">Send us a screenshot or link of that viral item. We&apos;ll research suppliers, check the real cost and send you a quote in Rand – no obligation until you say yes.</p>
            <ol className="mt-5 space-y-2 text-sm text-cream/80 list-decimal pl-5"><li>Tell us what you want and your budget</li><li>We research and send a quote</li><li>You pay, we order, it&apos;s on its way</li></ol>
            <Link href="/request" className="btn btn-primary mt-6">Request an Item</Link>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-20">
        <Reveal><h2 className="heading text-3xl sm:text-4xl text-center">Girlie love</h2><p className="text-center text-xs text-gold mt-2 uppercase tracking-widest">Sample reviews · demonstration content, not real customers</p></Reveal>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[["Sample review", "Obsessed with the bow bag – the delivery estimate was clear from the start so I knew exactly when to expect it."], ["Sample review", "Requested a top I saw on TikTok and got a quote on WhatsApp. Such a cute service!"], ["Sample review", "Love that everything is in Rand and the site tells you which items might arrive separately."]].map(([n, t], i) => (
            <Reveal key={i} delay={i * 100} className="card p-6"><p className="text-gold" aria-label="5 stars">★★★★★</p><p className="mt-3 text-cream/90 italic">&ldquo;{t}&rdquo;</p><p className="mt-3 text-xs text-cream/50">— {n} (demo)</p></Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-20">
        <Reveal className="text-center"><h2 className="heading text-3xl sm:text-4xl">Follow the pretty</h2><p className="text-cream/70 mt-2">Tag your picks for a chance to be featured</p></Reveal>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6">
          {social.map((p) => <a key={p.id} href={s.instagram} target="_blank" rel="noopener noreferrer" aria-label={`See ${p.title} on Instagram`} className="block rounded-xl overflow-hidden hover:opacity-80 transition"><ProductImage src={p.images[0]} alt={p.title} className="aspect-square" /></a>)}
        </div>
        <div className="flex justify-center gap-3 mt-6"><a href={s.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Instagram</a><a href={s.tiktok} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">TikTok</a></div>
      </section>

      <section className="mx-auto max-w-3xl px-4 mt-20 text-center">
        <Reveal className="card p-8">
          <h2 className="heading text-3xl">Join the Girlies list</h2>
          <p className="text-cream/70 mt-2 mb-5">New drops and pretty finds in your inbox. Unsubscribe anytime.</p>
          <NewsletterForm />
        </Reveal>
      </section>
    </>
  );
}
