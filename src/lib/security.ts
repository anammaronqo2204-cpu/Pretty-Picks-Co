import { headers } from "next/headers";
import crypto from "crypto";

const buckets = new Map<string, { count: number; reset: number }>();

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}

/** Basic in-memory rate limit (per server instance). Returns true when allowed. */
export async function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const k = `${key}:${await clientIp()}`;
  const now = Date.now();
  const b = buckets.get(k);
  if (!b || b.reset < now) {
    buckets.set(k, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= limit;
}

export function randomRef(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `${prefix}-${s}`;
}

export const token = () => crypto.randomBytes(24).toString("base64url");
export const sha256 = (d: string | Buffer) => crypto.createHash("sha256").update(d).digest("hex");

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length < 200;
export const isPhone = (s: string) => /^\+?[0-9 ()-]{9,16}$/.test(s);
export const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const ALLOWED_PROOF = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_UPLOAD = 5 * 1024 * 1024;

/** Check magic bytes so a renamed file can't pretend to be an image/PDF */
export function sniffMime(buf: Buffer): string | null {
  if (buf.subarray(0, 4).toString() === "%PDF") return "application/pdf";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.subarray(1, 4).toString() === "PNG") return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(0, 3).toString() === "GIF") return "image/gif";
  return null;
}
