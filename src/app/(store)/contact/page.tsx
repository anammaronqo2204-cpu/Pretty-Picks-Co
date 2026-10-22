import { ContactForm } from "@/components/Forms";
import { getPublicSettings } from "@/lib/data";
import Link from "next/link";

export const metadata = { title: "Contact & FAQ" };

const FAQ: [string, string][] = [
  ["How long does delivery take?", "Each product shows its own estimated arrival range, counted from when your payment is verified. Items from different suppliers may arrive separately."],
  ["Do you keep stock?", "Most items are sourced to order from our suppliers after payment is verified. Items marked “In stock locally” are held by us and ship sooner."],
  ["How do I pay?", "We currently accept EFT. After checkout you'll get our banking details and a unique reference, and you can upload your proof of payment. Your order is confirmed once funds reflect."],
  ["Can you find a specific item for me?", "Yes! Use Request an Item. We'll research it and send a quote. Nothing is confirmed until you accept and pay."],
  ["What if my item arrives damaged or wrong?", "Contact us within 7 days of delivery with photos. Your rights under the Consumer Protection Act are not affected."],
  ["Are products branded or official?", "We only describe a product as branded or official if we have verified it. Many of our items are affordable, trend-inspired fashion pieces."],
];

export default async function Contact() {
  const s = await getPublicSettings();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="heading text-4xl sm:text-5xl text-center">Get in touch</h1>
      <p className="text-center text-cream/70 mt-2">Questions, collabs or just want to say hi? We&apos;d love to hear from you.</p>
      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <ContactForm />
        <div className="space-y-4">
          <div className="card p-6 space-y-3">
            <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] text-white">Chat on WhatsApp</a>
            <a href={`mailto:${s.businessEmail}`} className="btn btn-ghost w-full">{s.businessEmail}</a>
            <div className="flex gap-3"><a href={s.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-ghost flex-1">Instagram</a><a href={s.tiktok} target="_blank" rel="noopener noreferrer" className="btn btn-ghost flex-1">TikTok</a></div>
            <Link href="/track" className="block text-center text-sm text-moon underline">Track an existing order</Link>
          </div>
        </div>
      </div>
      <section className="mt-14">
        <h2 className="heading text-3xl text-center mb-6">Frequently asked questions</h2>
        <div className="space-y-3 max-w-3xl mx-auto">{FAQ.map(([q, a]) => (
          <details key={q} className="card p-4 group"><summary className="cursor-pointer font-medium min-h-8 list-none flex justify-between">{q}<span className="text-moon group-open:rotate-45 transition">+</span></summary><p className="mt-3 text-cream/80">{a}</p></details>
        ))}</div>
      </section>
    </div>
  );
}
