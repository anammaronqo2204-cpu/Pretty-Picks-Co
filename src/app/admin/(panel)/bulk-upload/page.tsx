import { BulkUpload } from "@/components/BulkUpload";
import { listCollections } from "@/lib/data";

export const metadata = { title: "Bulk upload", robots: { index: false } };

export default async function BulkUploadPage() {
  const cols = await listCollections(true);
  return <BulkUpload collections={cols.map((c) => ({ slug: c.slug, name: c.name }))} />;
}
