import Link from "next/link";
import { db } from "@/db";
import { products } from "@/db/schema";
import { desc, eq, ilike, and, SQL } from "drizzle-orm";
import { th, td } from "@/components/admin";
import { zar, deliveryText } from "@/lib/format";
import { STOCK_STATUSES } from "@/lib/constants";
import { setProductStatusAction } from "../../actions";
import { ProductImage } from "@/components/ProductImage";
import { ensureSeed } from "@/lib/seed";

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await ensureSeed();
  const sp = await searchParams;
  const c: SQL[] = [];
  if (sp.q) c.push(ilike(products.title, `%${sp.q}%`));
  if (sp.status) c.push(eq(products.status, sp.status));
  const rows = await db.select().from(products).where(c.length ? and(...c) : undefined).orderBy(desc(products.updatedAt));
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4"><h1 className="heading text-3xl">Products</h1><div className="flex flex-wrap gap-2"><Link href="/admin/bulk-upload" className="btn btn-ghost">⬆ Bulk upload (ZIP)</Link><Link href="/admin/products/new" className="btn btn-primary">+ New product</Link></div></div>
      <form className="flex flex-wrap gap-2 mb-4"><input name="q" defaultValue={sp.q} placeholder="Search title" className="input !w-60" /><select name="status" defaultValue={sp.status ?? ""} className="input !w-40"><option value="">All statuses</option><option>draft</option><option>published</option><option>archived</option></select><button className="btn btn-ghost">Filter</button></form>
      <div className="card overflow-x-auto"><table className="w-full text-sm">
        <thead><tr>{["", "Product", "Status", "Price", "Cost", "Margin", "Supplier", "Delivery", "Stock", ""].map((h, i) => <th key={i} className={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((p) => {
          const cost = Number(p.supplierCost) + Number(p.sourcingCost), margin = Number(p.price) - cost;
          return (
            <tr key={p.id}>
              <td className={td}><ProductImage src={p.images[0]} alt="" className="w-12 h-12 rounded-lg" /></td>
              <td className={td}><Link href={`/admin/products/${p.id}`} className="font-medium hover:text-bright">{p.title}</Link>{p.featured && <span className="ml-1 text-gold">★</span>}{p.isDemo && <span className="ml-1 badge bg-black/50">demo</span>}<br /><span className="text-xs text-cream/50">{p.category}</span></td>
              <td className={td}><span className={`badge ${p.status === "published" ? "bg-gold/20 text-gold" : p.status === "draft" ? "bg-moon/15" : "bg-black/50"}`}>{p.status}</span>{p.publishAt && p.publishAt > new Date() && <p className="text-xs text-cream/50">from {p.publishAt.toLocaleDateString("en-ZA")}</p>}</td>
              <td className={td}>{zar(p.price)}</td><td className={td}>{zar(cost)}</td>
              <td className={td}><span className={margin < 0 ? "text-bright" : ""}>{zar(margin)}</span></td>
              <td className={td}>{p.supplierName}</td><td className={td}>{deliveryText(p.deliveryMin, p.deliveryMax)}</td>
              <td className={td}>{STOCK_STATUSES[p.stockStatus]}</td>
              <td className={td}><form action={setProductStatusAction}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value={p.status === "archived" ? "draft" : "archived"} /><button className="text-xs underline text-cream/60">{p.status === "archived" ? "Unarchive" : "Archive"}</button></form></td>
            </tr>
          );
        })}</tbody>
      </table>{rows.length === 0 && <p className="p-6 text-center text-cream/60">No products found.</p>}</div>
    </div>
  );
}
