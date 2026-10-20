import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { rateLimit, isEmail, str } from "@/lib/security";

export async function POST(req: Request) {
  if (!(await rateLimit("newsletter", 5, 10 * 60_000))) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  if (str(b.website)) return NextResponse.json({ ok: true });
  const email = str(b.email, 200).toLowerCase();
  if (!isEmail(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  const ex = await db.select({ id: messages.id }).from(messages).where(and(eq(messages.kind, "newsletter"), eq(messages.email, email))).limit(1);
  if (!ex.length) await db.insert(messages).values({ kind: "newsletter", email });
  return NextResponse.json({ ok: true });
}
