import Link from "next/link";
import { db } from "@/db";
import { itemRequests } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { th, td } from "@/components/admin";
import { zar } from "@/lib/format";
import { REQUEST_STATUSES } from "@/lib/constants";

export default async function Requests({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select().from(itemRequests).where(sp.status ? eq(itemRequests.status, sp.status) : undefined).orderBy(desc(itemRequests.createdAt)).limit(200);
  return (
    <div>
      <h1 className="heading text-3xl mb-4">Item requests</h1>
      <div className="flex flex-wrap gap-2 mb-4"><Link href="/admin/requests" className={`badge !py-2 ${!sp.status ? "bg-bright" : "bg-moon/15"}`}>All</Link>{Object.entries(REQUEST_STATUSES).map(([k, v]) => <Link key={k} href={`/admin/requests?status=${k}`} className={`badge !py-2 ${sp.status === k ? "bg-bright" : "bg-moon/15"}`}>{v}</Link>)}</div>
      <div className="card overflow-x-auto"><table className="w-full text-sm">
        <thead><tr>{["Ref", "Date", "Item", "Budget", "Contact", "Status", "Quote"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}>
            <td className={td}><Link href={`/admin/requests/${r.id}`} className="text-gold hover:underline">{r.reference}</Link></td>
            <td className={td}>{r.createdAt.toLocaleDateString("en-ZA")}</td>
            <td className={`${td} max-w-xs`}>{r.description.slice(0, 90)}</td>
            <td className={td}>{r.budget ? zar(r.budget) : "—"}</td>
            <td className={td}>{r.email}<br /><span className="text-xs text-cream/50">{r.whatsapp}</span></td>
            <td className={td}>{REQUEST_STATUSES[r.status]}</td>
            <td className={td}>{r.quotePrice ? zar(r.quotePrice) : "—"}</td>
          </tr>
        ))}</tbody></table>{rows.length === 0 && <p className="p-6 text-center text-cream/60">No requests.</p>}</div>
    </div>
  );
}
