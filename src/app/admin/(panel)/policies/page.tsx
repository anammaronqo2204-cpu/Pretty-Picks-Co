import Link from "next/link";
import { db } from "@/db";
import { policies } from "@/db/schema";
import { Flash } from "@/components/admin";
import { savePolicyAction } from "../../actions";
import { ensureSeed } from "@/lib/seed";

export default async function Policies({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; edit?: string }> }) {
  await ensureSeed();
  const sp = await searchParams;
  const all = await db.select().from(policies);
  const cur = all.find((p) => p.slug === (sp.edit ?? all[0]?.slug));
  return (
    <div className="space-y-4">
      <h1 className="heading text-3xl">Policies</h1>
      <p className="text-sm text-cream/60">Draft policies. Review with a legal adviser before launch. Formatting: <code>## Heading</code>, <code>- bullet</code>, <code>1. step</code>, <code>**bold**</code>, <code>_italic_</code>. Blank line between blocks.</p>
      <Flash sp={sp} />
      <div className="flex flex-wrap gap-2">{all.map((p) => <Link key={p.slug} href={`/admin/policies?edit=${p.slug}`} className={`badge !py-2 ${cur?.slug === p.slug ? "bg-bright" : "bg-moon/15"}`}>{p.title}</Link>)}<Link href="/admin/policies?edit=__new" className="badge !py-2 bg-gold/20 text-gold">+ New</Link></div>
      <form action={savePolicyAction} key={cur?.slug ?? "new"} className="card p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" defaultValue={cur?.title} required className="input" /></div>
          <div><label className="label" htmlFor="slug">Slug</label><input id="slug" name="slug" defaultValue={cur?.slug} required readOnly={!!cur} className="input" /></div>
        </div>
        <div><label className="label" htmlFor="body">Content</label><textarea id="body" name="body" rows={20} defaultValue={cur?.body} className="input font-mono text-sm" /></div>
        <div className="flex gap-2"><button className="btn btn-primary">Save policy</button>{cur && <a href={`/policies/${cur.slug}`} target="_blank" className="btn btn-ghost">View ↗</a>}</div>
      </form>
    </div>
  );
}
