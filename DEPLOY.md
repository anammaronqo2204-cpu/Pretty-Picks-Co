# Getting your own permanent link 

The preview you have now only exists while this sandbox is running, and only you can open it on your laptop. To get a link that **never expires and that anyone can open on any device**, the site needs to live on a real host with a real database.

Both parts are **free** to start:

| What | Free option | You get |
|---|---|---|
| Website hosting | Netlify or Vercel | `https://prettypicks.netlify.app` (permanent, shareable) |
| Database + files | Supabase | Postgres database for products, orders, uploads |
| Domain (optional) | Your `.co.za` registrar | `https://prettypicks.co.za` |

> **Nothing you type into the preview sandbox is permanent.** Do your real product setup *after* deploying, not here.

---

## Step 1: Database (Supabase, ~10 minutes)

1. Sign up at **supabase.com** (free).
2. **New project** → pick a name, a strong database password, and region *West EU* or *Africa (Cape Town)* if listed.
3. Wait for it to provision, then go to **Project Settings → Database**.
4. Under **Connection string**, choose **Session pooler** and copy the URI. It looks like:
   `postgresql://postgres.xxxx:YOUR-PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`
5. Replace `YOUR-PASSWORD` with the password you chose in step 2.

That URI is your `DATABASE_URL`.

**Turn on Row Level Security (important):** Supabase → **SQL Editor**, paste and run:

```sql
alter table admins enable row level security;
alter table sessions enable row level security;
alter table settings enable row level security;
alter table collections enable row level security;
alter table products enable row level security;
alter table media enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payment_proofs enable row level security;
alter table payment_events enable row level security;
alter table item_requests enable row level security;
alter table discount_codes enable row level security;
alter table policies enable row level security;
alter table messages enable row level security;
```

No policies needed. The website talks to the database through its own server code, so this simply blocks any direct browser access.

---

## Step 2: Put the code on GitHub (~5 minutes)

Your host deploys *from* GitHub, so the code needs to be there.

1. Download this project's files to your laptop.
2. Create a free account at **github.com**, then **New repository** (keep it **Private**).
3. In your terminal, inside the project folder:
   ```bash
   git init
   git add .
   git commit -m "Pretty Picks Co."
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/prettypicks.git
   git push -u origin main
   ```
   Never commit `.env`. It's ignored by default.

---

## Step 3: Deploy

### Option A: Netlify (matches the original brief)
1. **netlify.com** → sign up with GitHub.
2. **Add new site → Import an existing project** → choose your repo.
3. It auto-detects Next.js. `netlify.toml` is already in the project, so leave the build settings as detected (`npm run build`).
4. **Before deploying**, open **Site configuration → Environment variables** and add the ones from Step 4 below.
5. Deploy. Your link: `https://YOUR-SITE.netlify.app`.

### Option B: Vercel (easiest for Next.js)
1. **vercel.com** → sign up with GitHub → **Add New → Project** → import your repo.
2. No config needed. Vercel made Next.js.
3. Add the environment variables in the deploy form.
4. Your link: `https://YOUR-SITE.vercel.app`.

Either one is fine and both are free.

---

## Step 4: Environment variables

Add these in your host's dashboard (Netlify: *Site configuration → Environment variables*; Vercel: *Project → Settings → Environment Variables*):

```
NEXT_PUBLIC_SITE_URL=https://YOUR-SITE.netlify.app
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=27820000000

DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
ADMIN_LOCKED=1
ADMIN_SETUP_TOKEN=paste-a-long-random-string-here

PAYFAST_ENABLED=0
```

Notes:
- `ADMIN_LOCKED=1` **locks the admin panel**. Without it the dashboard is open to anyone. Preview mode.
- Anything starting with `NEXT_PUBLIC_` is visible to visitors. Never put a password or key in one of those.
- To make a random token, run this on your laptop: `openssl rand -hex 24`
- TLS to Supabase is switched on automatically when your connection string contains `sslmode=require`. You can force it with `DATABASE_SSL=1`.

After adding variables, **redeploy** (Netlify/Vercel → Deploys → Trigger deploy) so they take effect.

---

## Step 5: Create the database tables

From your laptop, inside the project folder, with your production URL:

```bash
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@...pooler.supabase.com:5432/postgres" npx drizzle-kit push
```

(On Windows PowerShell: `$env:DATABASE_URL="..."; npx drizzle-kit push`)

You should see the tables being created. The website then seeds itself automatically on first visit: 9 collections, the 12 demo products, draft policies and the `GIRLIES10` discount code.

If `drizzle-kit` complains about the connection, add `?sslmode=require` to the end of the URI, or use Supabase's **Direct connection** URI instead of the pooler.

---

## Step 6: First visit checklist

1. Open `https://YOUR-SITE.netlify.app`. The shop should show the 12 demo products.
2. Go to `/admin/setup`, enter your `ADMIN_SETUP_TOKEN`, your email and a password of **10+ characters**. This creates your admin login and then switches itself off.
3. **Admin → Settings:** enter your real banking details and tick *"I have verified these"*. Until then customers see "contact us before paying".
4. **Admin → Settings:** set your WhatsApp number, business email, Instagram and TikTok links, and delivery fee.
5. **Admin → Products:** delete or unpublish the demo products, then add your real ones.
6. **Admin → Policies:** edit the drafts. Have a legal adviser check them for CPA / ECTA / POPIA before you take real money.
7. Remove the sample reviews on the home page (`src/app/(store)/page.tsx`, the "Girlie love" section) or replace them with real, genuine reviews.
8. Place a **test order** end to end: checkout → upload proof → approve it in admin → check the tracking page.

---

## Step 7: Your own domain (optional, ~R120/year)

1. Buy `prettypicks.co.za` from a registrar (e.g. Afrihost, Domains.co.za, Xneelo).
2. Netlify: **Domain management → Add a domain** → follow the prompts. Either let Netlify manage DNS (update the nameservers at your registrar) or add the records Netlify shows you.
   Vercel: **Settings → Domains → Add** → same idea.
3. HTTPS is issued automatically, usually within minutes.
4. Update `NEXT_PUBLIC_SITE_URL` to your new domain and redeploy.

---

## What still needs real setup

These are built and wired, but need accounts or credentials before they work:

| Feature | Status |
|---|---|
| EFT + proof of payment + verification | Working now |
| PayFast / Yoco card payments | Structure ready at `src/lib/payments.ts` and `/api/payments/webhook/[provider]`. Needs merchant credentials. See README §12 |
| Email notifications (order confirmations, new-request alerts) | Not connected. Orders, proofs, requests and messages appear in **Admin → Inbox**. To add email, plug in a provider such as Resend where messages are inserted |
| Meta Pixel | Works as soon as you set `NEXT_PUBLIC_META_PIXEL_ID` |
| Spam rate limiting | Basic, per server instance. For stronger protection add Netlify's rate-limit rules or Upstash |

## Ongoing updates

Push to your GitHub `main` branch and Netlify/Vercel redeploys automatically. Schema changes need `npx drizzle-kit push` run against the production database.
