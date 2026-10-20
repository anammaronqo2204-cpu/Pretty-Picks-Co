import Link from "next/link";
import { CartProvider } from "@/components/CartProvider";
import { Header, WhatsAppFloat, ConsentAndPixel } from "@/components/Chrome";
import { getPublicSettings, listPolicies } from "@/lib/data";
import { NewsletterForm } from "@/components/Forms";
import { StoreBackButton } from "@/components/StoreBackButton";
import { Suspense } from "react";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [s, pols] = await Promise.all([getPublicSettings(), listPolicies()]);
  return (
    <CartProvider>
      <Header />
      <main id="main">
        <Suspense fallback={null}><StoreBackButton /></Suspense>
        {children}
      </main>
      <footer className="mt-20 border-t border-moon/10 bg-plum/50">
        <div className="mx-auto max-w-6xl px-5 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-script text-4xl">Pretty Picks Co.</p>
            <p className="text-sm text-cream/70 mt-2">Everything pretty, one place. Curated for the Girlies.</p>
            <div className="mt-4"><NewsletterForm compact /></div>
          </div>
          <div>
            <h2 className="heading text-moon mb-3">Shop</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="hover:text-bright">All products</Link></li>
              <li><Link href="/shop?newIn=1&sort=newest" className="hover:text-bright">New arrivals</Link></li>
              <li><Link href="/request" className="hover:text-bright">Request an item</Link></li>
              <li><Link href="/track" className="hover:text-bright">Track your order</Link></li>
              <li><Link href="/wishlist" className="hover:text-bright">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="heading text-moon mb-3">Policies</h2>
            <ul className="space-y-2 text-sm">{pols.map((p) => <li key={p.slug}><Link href={`/policies/${p.slug}`} className="hover:text-bright">{p.title}</Link></li>)}</ul>
          </div>
          <div>
            <h2 className="heading text-moon mb-3">Say hi</h2>
            <ul className="space-y-2 text-sm">
              <li><a href={`mailto:${s.businessEmail}`} className="hover:text-bright">{s.businessEmail}</a></li>
              <li><a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-bright">WhatsApp us</a></li>
              <li><a href={s.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-bright">Instagram</a></li>
              <li><a href={s.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-bright">TikTok</a></li>
              <li><Link href="/about" className="hover:text-bright">About us</Link></li>
              <li><Link href="/contact" className="hover:text-bright">Contact & FAQ</Link></li>
            </ul>
          </div>
        </div>
        <div className="gold-line" />
        <p className="text-center text-xs text-cream/50 py-5">© {new Date().getFullYear()} Pretty Picks Co. · Prices in ZAR · South Africa</p>
      </footer>
      <WhatsAppFloat number={s.whatsapp} />
      <ConsentAndPixel />
    </CartProvider>
  );
}
