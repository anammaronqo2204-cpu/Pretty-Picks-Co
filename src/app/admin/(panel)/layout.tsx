import Link from "next/link";
import { requireAdmin, ADMIN_UNLOCKED } from "@/lib/auth";
import { logoutAction } from "../actions";
import { AdminNavControls } from "@/components/AdminNavControls";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const metadata = { title: "Admin", robots: { index: false } };

const NAV = [["Dashboard", "/admin"], ["Orders", "/admin/orders"], ["Products", "/admin/products"], ["Bulk upload", "/admin/bulk-upload"], ["Requests", "/admin/requests"], ["Collections", "/admin/collections"], ["Inbox", "/admin/messages"], ["Policies", "/admin/policies"], ["Settings", "/admin/settings"], ["Go live 🚀", "/admin/deploy"]];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const a = await requireAdmin();
  const [{ unread }] = await db.select({ unread: sql<number>`count(*)::int` }).from(messages).where(eq(messages.read, false));
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="bg-plum border-b lg:border-b-0 lg:border-r border-moon/10 p-4 lg:min-h-screen lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto">
        <Link href="/admin" className="font-script text-3xl block">Pretty Picks</Link>
        <p className="text-xs text-cream/50 mb-4">Admin · {a.email}</p>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto text-sm">
          {NAV.map(([l, h]) => <Link key={h} href={h} className="px-3 py-2 rounded-lg hover:bg-moon/10 whitespace-nowrap">{l}{l === "Inbox" && unread > 0 && <span className="ml-2 badge bg-bright">{unread}</span>}</Link>)}
          <Link href="/" target="_blank" className="px-3 py-2 rounded-lg hover:bg-moon/10 whitespace-nowrap text-moon">View store ↗</Link>
          <form action={logoutAction}><button className="px-3 py-2 rounded-lg hover:bg-moon/10 text-left w-full text-cream/60">Log out</button></form>
        </nav>
      </aside>
      <div className="p-4 sm:p-8 min-w-0">
        <AdminNavControls />
        {ADMIN_UNLOCKED && <p role="alert" className="mb-4 rounded-xl border border-bright/60 bg-bright/15 p-3 text-sm">🔓 <strong>Preview mode – admin is unlocked.</strong> Anyone with the link can open this dashboard. Set <code>ADMIN_LOCKED=1</code> to require login before going live. Want a permanent shareable link? See <Link href="/admin/deploy" className="underline">Go live</Link>.</p>}
        {children}
      </div>
    </div>
  );
}
