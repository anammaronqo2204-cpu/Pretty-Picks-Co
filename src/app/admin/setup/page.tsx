import { redirect } from "next/navigation";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { sql } from "drizzle-orm";
import { setupAction } from "../actions";

export const metadata = { title: "Admin setup", robots: { index: false } };

export default async function Setup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(admins);
  if (c > 0) redirect("/admin/login");
  const { error } = await searchParams;
  const needToken = !!process.env.ADMIN_SETUP_TOKEN;
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form action={setupAction} className="card p-8 w-full max-w-sm space-y-4">
        <h1 className="heading text-2xl text-center">Create first administrator</h1>
        <p className="text-sm text-cream/70">This page only works while no admin exists. {needToken ? "Enter the ADMIN_SETUP_TOKEN from your environment." : "Tip: set ADMIN_SETUP_TOKEN in production to protect this step."}</p>
        {error && <p role="alert" className="text-bright text-sm">{error}</p>}
        {needToken && <div><label className="label" htmlFor="setupToken">Setup token</label><input id="setupToken" name="setupToken" type="password" required className="input" /></div>}
        <div><label className="label" htmlFor="name">Your name</label><input id="name" name="name" className="input" /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
        <div><label className="label" htmlFor="password">Password (min 10 characters)</label><input id="password" name="password" type="password" minLength={10} required autoComplete="new-password" className="input" /></div>
        <button className="btn btn-primary w-full">Create admin</button>
      </form>
    </div>
  );
}
