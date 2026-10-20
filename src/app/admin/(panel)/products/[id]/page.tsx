import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProductForm } from "@/components/ProductForm";
import { Flash } from "@/components/admin";
import { listCollections } from "@/lib/data";

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  const p = id === "new" ? null : (await db.select().from(products).where(eq(products.id, Number(id) || 0)).limit(1))[0];
  if (id !== "new" && !p) notFound();
  const cols = await listCollections(false);
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-moon">← Products</Link>
      <h1 className="heading text-3xl mb-4 mt-1">{p ? `Edit: ${p.title}` : "New product"}</h1>
      <Flash sp={sp} />
      <ProductForm key={p?.updatedAt.toISOString() ?? "new"} p={p as unknown as Record<string, unknown> | null} collections={cols.map((c) => ({ slug: c.slug, name: c.name }))} />
    </div>
  );
}
