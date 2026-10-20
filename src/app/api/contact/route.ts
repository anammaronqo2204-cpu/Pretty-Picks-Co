import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { rateLimit, isEmail, str } from "@/lib/security";

export async function POST(req: Request) {
  if (!(await rateLimit("contact", 5, 10 * 60_000))) return NextResponse.json({ error: "Too many messages. Please try later." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  if (str(b.website)) return NextResponse.json({ ok: true });
  const name = str(b.name, 100), email = str(b.email, 200), body = str(b.body, 2000);
  if (!name || !isEmail(email) || body.length < 5) return NextResponse.json({ error: "Please complete your name, a valid email and your message." }, { status: 400 });
  await db.insert(messages).values({ kind: "contact", name, email, phone: str(b.phone, 20), body });
  return NextResponse.json({ ok: true });
}
