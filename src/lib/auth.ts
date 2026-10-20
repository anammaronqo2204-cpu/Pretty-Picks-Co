import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { admins, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sha256, token } from "./security";

const COOKIE = "ppc_admin";

export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const h = crypto.scryptSync(pw, salt, 64);
  const s = Buffer.from(hash, "hex");
  return s.length === h.length && crypto.timingSafeEqual(h, s);
}

export async function createSession(adminId: number) {
  const t = token();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await db.insert(sessions).values({ id: sha256(t), adminId, expiresAt });
  const secure = process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1";
  // sameSite "none" (with secure) lets login work inside embedded previews; Next.js server actions still verify Origin.
  (await cookies()).set(COOKIE, t, { httpOnly: true, sameSite: secure ? "none" : "lax", secure, path: "/", expires: expiresAt });
}

export async function destroySession() {
  const c = await cookies();
  const t = c.get(COOKIE)?.value;
  if (t) await db.delete(sessions).where(eq(sessions.id, sha256(t)));
  c.delete(COOKIE);
}

/**
 * TEMPORARY PREVIEW MODE: admin is unlocked so the dashboard can be reviewed.
 * Set ADMIN_LOCKED=1 in the environment to require login again. MUST be set before launch.
 */
export const ADMIN_UNLOCKED = process.env.ADMIN_LOCKED !== "1";

export async function getAdmin() {
  if (ADMIN_UNLOCKED) return { id: 0, email: "preview-mode (unlocked)", name: "Preview" };
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const rows = await db
    .select({ id: admins.id, email: admins.email, name: admins.name })
    .from(sessions)
    .innerJoin(admins, eq(admins.id, sessions.adminId))
    .where(and(eq(sessions.id, sha256(t)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
}

/** Server-side authorisation guard: use in every admin page, action and route. */
export async function requireAdmin() {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}
