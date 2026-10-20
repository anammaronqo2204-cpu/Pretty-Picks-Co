import { db } from "@/db";
import { messages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { markReadAction } from "../../actions";

export default async function Inbox({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select().from(messages).where(sp.kind ? eq(messages.kind, sp.kind) : undefined).orderBy(desc(messages.createdAt)).limit(300);
  const subs = sp.kind === "newsletter" ? rows.map((r) => r.email).join(", ") : "";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2"><h1 className="heading text-3xl">Inbox & notifications</h1><form action={markReadAction}><input type="hidden" name="all" value="1" /><button className="btn btn-ghost">Mark all read</button></form></div>
      <div className="flex gap-2">{[["", "All"], ["notification", "Notifications"], ["contact", "Contact messages"], ["newsletter", "Newsletter sign-ups"]].map(([k, l]) => <a key={k} href={`/admin/messages${k ? `?kind=${k}` : ""}`} className={`badge !py-2 ${(sp.kind ?? "") === k ? "bg-bright" : "bg-moon/15"}`}>{l}</a>)}</div>
      <p className="text-xs text-cream/60">New orders, proofs of payment and item requests appear here. Email notifications require configuring an email provider (see README).</p>
      {subs && <textarea readOnly className="input text-xs" rows={3} value={subs} aria-label="Subscriber emails" />}
      <ul className="space-y-2">{rows.map((m) => (
        <li key={m.id} className={`card p-4 text-sm ${m.read ? "opacity-60" : "border-bright/40"}`}>
          <div className="flex justify-between gap-2"><span className="badge bg-moon/15">{m.kind}</span><span className="text-xs text-cream/50">{m.createdAt.toLocaleString("en-ZA")}</span></div>
          {(m.name || m.email) && <p className="mt-1">{m.name} {m.email && <a href={`mailto:${m.email}`} className="underline text-moon">{m.email}</a>} {m.phone}</p>}
          {m.body && <p className="mt-1 whitespace-pre-line">{m.body}</p>}
          {!m.read && <form action={markReadAction} className="mt-2"><input type="hidden" name="id" value={m.id} /><button className="text-xs underline">Mark read</button></form>}
        </li>
      ))}</ul>
      {rows.length === 0 && <p className="text-cream/60">Nothing here yet.</p>}
    </div>
  );
}
