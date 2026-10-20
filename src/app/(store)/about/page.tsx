import Link from "next/link";
import { BlossomTree, Petals, Reveal } from "@/components/Decor";

export const metadata = { title: "About" };

export default function About() {
  return (
    <div className="relative overflow-hidden">
      <Petals count={12} />
      <BlossomTree className="absolute -right-16 top-10 w-80 opacity-50" flip />
      <div className="relative mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-script text-6xl sm:text-7xl">Hello, gorgeous.</h1>
        <Reveal className="mt-6 space-y-4 text-lg text-cream/85">
          <p>Pretty Picks Co. is a curated online destination for feminine fashion, trending finds, accessories and little luxuries – all in one dreamy place, priced in Rand for South African girlies.</p>
          <p>Instead of scrolling through endless marketplaces, we do the digging for you. We hand-pick pieces from a range of suppliers, write honest descriptions and show a clear delivery estimate on every single product.</p>
          <p>Most items are sourced to order: once your payment is verified, we place your order with the supplier. That&apos;s how we keep prices sweet without sitting on mountains of stock.</p>
          <p>And if you&apos;ve spotted something on TikTok or Insta that you just <em className="text-gold not-italic">need</em>? Our personal sourcing service will try to find it for you and send you a quote – no pressure.</p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {[["Curated", "Pretty, on-trend pieces chosen with care."], ["Honest", "Clear estimates, real descriptions, no fake claims."], ["Personal", "A real person behind every order and request."]].map(([t, d]) => <div key={t} className="card p-5"><p className="heading text-xl text-moon">{t}</p><p className="text-sm mt-1 text-cream/75">{d}</p></div>)}
        </div>
        <div className="flex gap-3 mt-10"><Link href="/shop" className="btn btn-primary">Shop the Edit</Link><Link href="/contact" className="btn btn-ghost">Say hi</Link></div>
      </div>
    </div>
  );
}
