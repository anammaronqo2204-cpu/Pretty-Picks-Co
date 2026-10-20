import { notFound } from "next/navigation";
import Link from "next/link";
import { getPolicy, listPolicies } from "@/lib/data";
import { Markdown } from "@/lib/markdown";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPolicy((await params).slug);
  return { title: p?.title ?? "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, all] = await Promise.all([getPolicy(slug), listPolicies()]);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 grid md:grid-cols-[220px_1fr] gap-8">
      <nav aria-label="Policies" className="text-sm space-y-1">{all.map((x) => <Link key={x.slug} href={`/policies/${x.slug}`} className={`block py-2 px-3 rounded-lg ${x.slug === slug ? "bg-bright/15 text-bright" : "hover:bg-moon/10"}`}>{x.title}</Link>)}</nav>
      <article className="card p-6 sm:p-8">
        <h1 className="heading text-3xl sm:text-4xl">{p.title}</h1>
        <p className="text-xs text-cream/50 mt-1">Last updated {p.updatedAt.toLocaleDateString("en-ZA")}</p>
        <div className="mt-4"><Markdown text={p.body} /></div>
      </article>
    </div>
  );
}
