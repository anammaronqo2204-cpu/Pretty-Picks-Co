import { listCollections } from "@/lib/data";
import { Flash } from "@/components/admin";
import { saveCollectionAction } from "../../actions";

export default async function Collections({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const cols = await listCollections(false);
  const Row = ({ c }: { c?: (typeof cols)[number] }) => (
    <form action={saveCollectionAction} className="card p-3 grid sm:grid-cols-[1fr_1fr_2fr_80px_auto_auto] gap-2 items-center">
      {c && <input type="hidden" name="id" value={c.id} />}
      <input name="name" defaultValue={c?.name} placeholder="Name" aria-label="Name" className="input" required />
      <input name="slug" defaultValue={c?.slug} placeholder="slug (auto)" aria-label="Slug" className="input" />
      <input name="description" defaultValue={c?.description} placeholder="Description" aria-label="Description" className="input" />
      <input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? cols.length} aria-label="Order" className="input" />
      <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> Active</label>
      <div className="flex gap-1"><button className="btn btn-primary !min-h-10 !py-1 text-sm">{c ? "Save" : "Add"}</button>{c && <button name="delete" value="1" className="btn btn-ghost !min-h-10 !py-1 text-sm">Delete</button>}</div>
    </form>
  );
  return (
    <div className="space-y-3">
      <h1 className="heading text-3xl">Collections</h1>
      <p className="text-sm text-cream/60">Rename, reorder (lower number = first), hide or add collections. Assign products to collections in the product editor.</p>
      <Flash sp={sp} />
      {cols.map((c) => <Row key={c.id} c={c} />)}
      <h2 className="heading text-xl pt-4">Add a collection</h2>
      <Row />
    </div>
  );
}
