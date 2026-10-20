import { TrackForm } from "@/components/Forms";

export const metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="heading text-4xl text-center">Track your order</h1>
      <p className="text-center text-cream/70 mt-2 mb-8">Enter your order number (e.g. PP-AB12CD) and the email you used at checkout.</p>
      <TrackForm />
    </div>
  );
}
