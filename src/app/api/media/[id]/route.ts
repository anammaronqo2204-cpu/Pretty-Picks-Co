import { db } from "@/db";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdmin } from "@/lib/auth";

/** Public media (product photos) are served to anyone; private media (proofs, request images) only to admins. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Not found", { status: 404 });
  const m = (await db.select().from(media).where(eq(media.id, id)).limit(1))[0];
  if (!m) return new Response("Not found", { status: 404 });
  if (!m.isPublic && !(await getAdmin())) return new Response("Forbidden", { status: 403 });
  return new Response(new Uint8Array(m.data), {
    headers: { "Content-Type": m.mime, "Cache-Control": m.isPublic ? "public, max-age=31536000, immutable" : "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": m.mime === "application/pdf" ? "inline" : "inline" },
  });
}
