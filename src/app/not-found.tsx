import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center text-center px-4">
      <div><p className="font-script text-7xl text-moon">Oh no, babe</p><p className="mt-3 text-cream/70">We couldn&apos;t find that page.</p><Link href="/" className="btn btn-primary mt-6">Back home</Link></div>
    </div>
  );
}
