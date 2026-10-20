import { RequestForm } from "@/components/Forms";
import { Petals, BlossomTree } from "@/components/Decor";

export const metadata = { title: "Request an Item" };

export default function RequestPage() {
  return (
    <div className="relative overflow-hidden">
      <Petals count={10} />
      <BlossomTree flip className="absolute -right-20 top-20 w-72 opacity-30 pointer-events-none hidden lg:block" />
      <div className="relative mx-auto max-w-2xl px-4 py-12">
        <p className="smallcaps text-gold text-sm text-center">Personal sourcing service</p>
        <h1 className="font-script text-6xl text-center mt-2">Request an Item</h1>
        <p className="text-center text-cream/80 mt-3">Saw something pretty online? Tell us about it. We&apos;ll research suppliers and send you a quote in Rand. <strong>Submitting a request doesn&apos;t confirm availability or price</strong> – you only pay once you accept our quote.</p>
        <div className="mt-8"><RequestForm /></div>
      </div>
    </div>
  );
}
