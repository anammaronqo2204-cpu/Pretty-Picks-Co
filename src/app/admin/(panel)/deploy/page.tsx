import Link from "next/link";

export const metadata = { title: "Go live", robots: { index: false } };

const STEPS: [string, string, React.ReactNode][] = [
  ["1", "Database: Supabase (free)", <>Sign up at <strong>supabase.com</strong>, create a project, then copy the <strong>Session pooler</strong> connection string from <em>Project Settings → Database</em>. That becomes your <code>DATABASE_URL</code>. Then enable Row Level Security on all tables so nothing can be reached directly from a browser.</>],
  ["2", "Code. GitHub (free)", <>Create a <strong>private</strong> repository and push this project to it. Your host deploys from GitHub, so the code has to live there. Never commit your <code>.env</code> file.</>],
  ["3", "Host. Netlify or Vercel (free)", <>Import the repo. Netlify reads the included <code>netlify.toml</code>; Vercel needs no configuration at all. You get a permanent, shareable address like <code>https://prettypicks.netlify.app</code> that anyone can open on any device.</>],
  ["4", "Environment variables", <>Add them in your host&apos;s dashboard <strong>before</strong> deploying: <code>NEXT_PUBLIC_SITE_URL</code>, <code>NEXT_PUBLIC_WHATSAPP_NUMBER</code>, <code>DATABASE_URL</code>, <code>ADMIN_LOCKED=1</code>, <code>ADMIN_SETUP_TOKEN</code>, and <code>NEXT_PUBLIC_META_PIXEL_ID</code> when you have one. Redeploy after adding them.</>],
  ["5", "Create the tables", <>From your laptop, in the project folder:<br /><code>DATABASE_URL=&quot;postgresql://…&quot; npx drizzle-kit push</code><br />The site then seeds itself on first visit.</>],
  ["6", "First admin", <>Open <code>/admin/setup</code> with your setup token and a password of 10+ characters. The page switches itself off afterwards.</>],
  ["7", "Before you take money", <>Enter and verify your banking details in Settings, replace the demo products, edit the draft policies (have them checked for CPA / ECTA / POPIA), remove the sample reviews, and place one test order end to end.</>],
];

export default function Deploy() {
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="heading text-3xl">Go live: get your own permanent link</h1>
      <p className="card p-4 text-sm border-bright/50">
        This preview only exists while the sandbox runs and only opens on your machine. For a link that never expires and that you can share with customers, deploy the site to a real host with a real database. Everything below is free to start. Full version: <code>DEPLOY.md</code> in the project root.
      </p>
      <ol className="space-y-4">{STEPS.map(([n, t, d]) => (
        <li key={n} className="card p-5">
          <h2 className="heading text-xl text-moon">{n}. {t}</h2>
          <div className="text-sm text-cream/80 mt-2 space-y-1">{d}</div>
        </li>
      ))}</ol>
      <div className="card p-5 text-sm space-y-2">
        <h2 className="heading text-xl text-gold">Heads up</h2>
        <p>• Anything you enter in this preview is temporary. Do your real product setup after deploying.</p>
        <p>• The admin panel is currently <strong>unlocked</strong>. Set <code>ADMIN_LOCKED=1</code> before launch.</p>
        <p>• Card payments (PayFast/Yoco) and email notifications are built as stubs that need credentials. EFT works today; everything else lands in <Link href="/admin/messages" className="underline text-moon">Inbox</Link>.</p>
        <p>• Photo storage: images uploaded through <Link href="/admin/bulk-upload" className="underline text-moon">Bulk upload</Link> are stored in the database. Supabase&apos;s free tier includes 500MB, so compress photos before zipping them.</p>
      </div>
    </div>
  );
}
