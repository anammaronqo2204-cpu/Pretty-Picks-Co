# Pretty Picks Co. 
*Everything pretty, one place. Curated for the Girlies.*

A full e-commerce store for South Africa (ZAR): storefront, cart, checkout with EFT and proof-of-payment upload, order tracking, Request an Item, editable policies, Meta Pixel, and a private admin dashboard.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL via Drizzle ORM (works with Supabase Postgres or any managed Postgres) · in-house admin auth (scrypt hashes and DB-stored sessions in httpOnly cookies).

## 1. Prerequisites
- Node.js 20+ (22 recommended)
- A PostgreSQL database. Supabase's free tier works: use its **connection pooler** URI.

## 2. Install
```bash
npm install
```

## 3. Environment variables
Copy `.env.example` to `.env` and fill it in.
| Variable | Public? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL |
| `NEXT_PUBLIC_META_PIXEL_ID` | public | Meta Pixel. Leave it empty to turn tracking off |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | public | Default WhatsApp number (digits only, e.g. `27821234567`) |
| `DATABASE_URL` | **server only** | Postgres connection string |
| `ADMIN_SETUP_TOKEN` | **server only** | Protects first-admin creation |
| `PAYFAST_*`, `YOCO_*` | **server only** | Future payment gateways |
| `EMAIL_*` | **server only** | Future email notifications |

Never commit `.env`. Never put a secret in a `NEXT_PUBLIC_` variable.

## 4. Database
```bash
npx drizzle-kit push      # creates the tables from src/db/schema.ts
```
`drizzle.config.json` contains a local URL. Edit it, or run `DATABASE_URL=... npx drizzle-kit push` after pointing the config at your production database.
The app seeds itself on first request with: 9 collections, **12 demonstration products** (labelled "Demo"), draft policies and the code `GIRLIES10`.

**Security model:** the browser never talks to the database directly. All access goes through server code, which selects only public columns for customers (see `publicProductColumns` in `src/lib/data.ts`). If you use Supabase, turn on Row Level Security on all tables and add **no** policies. That blocks the public anon key completely.

## 5. First administrator
1. Set `ADMIN_SETUP_TOKEN` to a long random string.
2. Visit `/admin/setup`, enter the token, your email and a password of at least 10 characters.
3. The setup page switches itself off once an admin exists. You can add more admins in **Admin → Settings**.
No admin credentials are hard-coded.

## 6. Managing products
Go to **Admin → Products → New product**.
- **Private fields** (supplier, supplier URL, cost, sourcing costs, markup, internal notes) are never shown to customers.
- **Suggested price** = (supplier cost + sourcing costs) × (1 + markup/100). Leave the selling price blank to use the suggestion, or type your own.
- Set delivery min/max days for each product. This becomes "Estimated arrival: X to Y days".
- Stock status: *Sourced to order*, *In stock locally* (only if you physically hold the item), *Limited*, or *Unavailable* (blocks ordering).
- Draft → Published → Archived. Scheduled publishing is supported. **Preview** shows drafts to admins only.
- Upload photos (≤5MB). Compress them to about 300KB first for mobile data.
- Collections: **Admin → Collections** lets you rename, reorder, hide or add.
- Delete or unpublish the demo products before launch.

### Bulk upload from a ZIP
**Admin → Bulk upload.** Name each photo with the product name and price, then zip them:

```
Pink Y2K bag - R250.jpg          →  "Pink Y2K bag"   R250
Rose Gold Set - R1 250,00.png    →  "Rose Gold Set"  R1 250
R179 Heart Necklace.webp         →  "Heart Necklace" R179
```

1. Choose the ZIP. Every image is read in the browser and listed with its detected name and price.
2. Fix any name or price inline, untick anything you don't want. Rows where no price was found are flagged.
3. Pick the supplier once (SHEIN is preselected and sets ETA to 10 to 18 days; Temu 12 to 21, Mr Price 5 to 9, PEP 3 to 6). Edit the ETA if your supplier differs. Add a category, collections, an optional shared description, and choose **Draft** (default) or **Publish**.
4. Import. Each photo becomes a product with that supplier, ETA, price and photo. Duplicate names are skipped if the box is ticked.

Limits: 100 images, 5MB per image, 25MB per ZIP. Photos are stored in the database, so compress them (~300KB) to keep your Supabase storage small. Supplier cost and markup are left at 0/"not set". Set them per product if you want accurate profit figures. Prices come from the filename, so double-check a few before publishing.

## 7. EFT payment verification
1. The customer checks out and gets a unique reference (`PP-XXXXXX`) and a private order link.
2. Banking details appear **only** after you enter them and tick "verified" in **Admin → Settings**.
3. The customer uploads proof (PDF/JPG/PNG/WebP, ≤5MB, file type checked). Proofs are stored privately and only admins can view them. Duplicate files are rejected.
4. The order shows **Proof Received: Verifying**. Check your bank account. To approve, you must tick "funds have cleared". A screenshot alone never marks an order paid.
5. Approval records the payment as verified, writes an audit-trail entry and unlocks supplier ordering. Supplier steps are blocked until payment is verified.
6. Track each item separately (supplier order #, tracking #, the 8-step workflow). Refunds and cancellations are recorded on the order.

## 8. WhatsApp
Set the number in **Admin → Settings** (or `NEXT_PUBLIC_WHATSAPP_NUMBER`), in international format without `+`.

## 9. Meta Pixel
Set `NEXT_PUBLIC_META_PIXEL_ID`. The pixel loads only after the visitor accepts the cookie banner. Events: PageView (on every client-side route change), ViewContent, AddToCart, InitiateCheckout, Contact (WhatsApp clicks), and Purchase. Purchase fires once per order, on the customer's order page, only after you verify payment, using the confirmed ZAR total. No personal data is sent. All logic lives in `src/lib/pixel.ts`.

> **Want a permanent, shareable link?** See **[DEPLOY.md](./DEPLOY.md)**. A beginner-friendly, step-by-step guide (Supabase + GitHub + Netlify/Vercel, all free).

## 10. Deploy to Netlify
1. Push to GitHub, then in Netlify choose **Add new site → Import**.
2. Netlify detects Next.js automatically through its OpenNext adapter. `netlify.toml` is included.
3. Add the environment variables under **Site settings → Environment variables**.
4. Run `npx drizzle-kit push` against the production database once.
**Notes:** uploads are stored in Postgres (as `bytea`), so serverless functions need no extra file storage. Rate limiting is in memory per function instance. For stronger protection, add Netlify's rate-limiting rules or Upstash.

## 11. Custom domain
Netlify → **Domain management → Add domain**. Point your DNS (e.g. at your `.co.za` registrar) to Netlify, or use Netlify DNS. HTTPS is issued automatically. Then update `NEXT_PUBLIC_SITE_URL`.

## 12. Adding PayFast or Yoco later
`src/lib/payments.ts` defines a `PaymentProvider` interface. To add one:
1. Implement `initiate()` so it returns `{ kind: "redirect", url }`.
2. Implement `verifyWebhook()`. **Check the signature, the source and the amount on the server.** For PayFast, also post back to its validate endpoint.
3. Point the gateway's notify/webhook URL to `/api/payments/webhook/payfast` (or `/yoco`). That route already marks orders paid only after verification and logs an audit entry.
4. Add a radio option in the checkout page. Card details never touch this server.

## 13. Launch checklist
- [ ] **Set `ADMIN_LOCKED=1`**. Without it the admin dashboard runs in unlocked preview mode and anyone can open it
- [ ] Remove or unpublish demo products and remove the sample reviews on the home page
- [ ] Have a legal adviser review all policies (CPA, ECTA, POPIA). Fill in your Information Officer details
- [ ] Enter and verify banking details
- [ ] Set a strong `ADMIN_SETUP_TOKEN`, create your admin, use a strong unique password
- [ ] Turn on Supabase RLS (if using Supabase) and keep `DATABASE_URL` server-side only
- [ ] Set your WhatsApp, email and social links
- [ ] Place a test order end to end: checkout → proof upload → approve → tracking
- [ ] Only use photos you have rights to. Don't call products "authentic" or "official" unless you've verified it
- [ ] Email notifications are **not** implemented yet. Notifications appear in Admin → Inbox. Plug in an email provider (e.g. Resend) where messages are inserted if you want email alerts
