import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { sql } from "drizzle-orm";
import { loginAction } from "../actions";
import { getAdmin } from "@/lib/auth";

export const metadata = { title: "Admin login", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(admins);
  const { error } = await searchParams;
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form action={loginAction} className="card p-8 w-full max-w-sm space-y-4">
        <p className="font-script text-4xl text-center">Pretty Picks Co.</p>
        <h1 className="heading text-xl text-center text-moon">Admin sign in</h1>
        {error && <p role="alert" className="text-bright text-sm">{error}</p>}
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="username" className="input" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
        <button className="btn btn-primary w-full">Sign in</button>
        {c === 0 && <Link href="/admin/setup" className="block text-center text-sm text-gold underline">No admin yet? Create the first administrator</Link>}
      </form>
    </div>
  );
}
