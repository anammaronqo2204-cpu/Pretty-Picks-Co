import "server-only";
import { db } from "@/db";
import { collections, products, settings, policies, discountCodes } from "@/db/schema";
import { sql } from "drizzle-orm";

export type SiteSettings = {
  businessEmail: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  shippingFee: number;
  freeShippingOver: number;
  eftFeePerOrder: number;
  bank: { bankName: string; accountName: string; accountNumber: string; branchCode: string; accountType: string; verified: boolean };
};

export const DEFAULT_SETTINGS: SiteSettings = {
  businessEmail: "hello@prettypicks.co.za",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "27000000000",
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  shippingFee: 99,
  freeShippingOver: 900,
  eftFeePerOrder: 0,
  bank: { bankName: "", accountName: "", accountNumber: "", branchCode: "", accountType: "Cheque", verified: false },
};

const DRAFT = "\n\n_DRAFT: review with a legal adviser before launch._";

export const DEFAULT_POLICIES: { slug: string; title: string; body: string }[] = [
  { slug: "shipping", title: "Shipping & Delivery", body: `## How delivery works
Most Pretty Picks Co. products are sourced to order from third-party suppliers. We place your order with the supplier only **after your payment has been verified**.

## Delivery estimates
Each product shows its own estimated arrival range (for example "Estimated arrival: 7 to 14 days"). Estimates count from payment verification and are estimates, not guarantees. Supplier and courier delays can happen; we'll keep you updated if anything changes.

## Multiple suppliers
Orders containing items from different suppliers may arrive in separate parcels on different dates.

## Fees
A flat delivery fee applies within South Africa unless your order qualifies for free delivery, as shown at checkout.

## Checking
Where items pass through us, we check them on arrival before forwarding them to you.` + DRAFT },
  { slug: "returns", title: "Returns, Refunds & Exchanges", body: `## Your rights
Nothing in this policy limits your rights under the Consumer Protection Act 68 of 2008 (CPA) or the Electronic Communications and Transactions Act (ECTA).

## Defective, damaged, incorrect or misdescribed items
1. Contact us within 7 days of delivery via WhatsApp or email with your order number.
2. Include clear photos of the item, the issue and the packaging.
3. We'll review and confirm next steps (repair, replacement or refund) in line with the CPA. Where the CPA's 6-month implied warranty for defective goods applies, it is honoured.

## Change of mind
Under ECTA you may cancel an online purchase within 7 days of receiving goods. Items must be unused, in original packaging; you may be responsible for return delivery costs. Hygiene items (e.g. opened beauty products, earrings) may be excluded where permitted by law.

## Refunds
Approved refunds are paid by EFT to the account that paid, normally within 10 business days of approval.` + DRAFT },
  { slug: "sourcing", title: "Sourcing & Special Requests", body: `## Request an Item
You can ask us to find a specific item. Submitting a request is free and does **not** confirm availability or price.

## Quotes
We research the item with suppliers and send you a quote. Quotes are valid for the period stated in the quote, as supplier prices change.

## Ordering
We only purchase the item once you accept the quote and your payment is verified. Requested items are sourced from third parties; we describe them based on supplier information and our checks and do not claim items are branded or official unless verified.` + DRAFT },
  { slug: "payment", title: "Payment Terms", body: `## EFT
We currently accept EFT (bank transfer). Use your order reference as the payment reference and upload your proof of payment.

## Verification
A proof of payment is not confirmation that funds have cleared. Your order is confirmed only once we see the funds in our account. This usually takes 1 to 3 business days for inter-bank transfers.

## Unpaid orders
Orders not paid within 48 hours may be cancelled.

## Card payments
We do not store card details. Future card payments will be processed by a PCI-compliant payment provider.` + DRAFT },
  { slug: "privacy", title: "Privacy Policy", body: `## What we collect
Name, contact details, delivery address, order history and proof of payment documents you upload.

## Why
To process and deliver orders, respond to requests and, if you opt in, send our newsletter.

## Sharing
We share delivery details with couriers and, where required to fulfil your order, suppliers. We never sell your information.

## Security
Proof of payment documents are stored privately and only accessible to authorised administrators.` + DRAFT },
  { slug: "popia", title: "POPIA Compliance", body: `Pretty Picks Co. processes personal information in line with the Protection of Personal Information Act 4 of 2013.

- **Information Officer:** the business owner (contact via our business email).
- You may request access to, correction of, or deletion of your personal information.
- You may object to processing for direct marketing at any time.
- You may lodge a complaint with the Information Regulator (inforegulator.org.za).` + DRAFT },
  { slug: "cookies", title: "Cookie Notice", body: `We use essential browser storage for your cart, wishlist and admin login. With your consent, we load the Meta Pixel to measure ad performance. You can change your choice at any time by clearing your browser storage.` + DRAFT },
  { slug: "terms", title: "Terms & Conditions", body: `## About us
Pretty Picks Co. is a curated online store. Products are sourced from third-party suppliers.

## Product information
Product descriptions are based on supplier information and our own checks. Colours may vary slightly. We do not describe products as authentic, original or officially branded unless verified.

## Prices
Prices are in South African Rand (ZAR) and include any applicable taxes. We may correct obvious pricing errors before your payment is verified.

## Orders
An order is accepted once payment is verified. If an item becomes unavailable, we will offer an alternative or a full refund.` + DRAFT },
];

const COLLECTIONS = [
  ["The Pretty Edit", "the-pretty-edit", "Our favourite finds, hand-picked this month."],
  ["Main Character Energy", "main-character-energy", "Statement pieces for your moment."],
  ["Pink Obsession", "pink-obsession", "All pink, all the time."],
  ["Everyday Girly", "everyday-girly", "Soft, sweet everyday staples."],
  ["Going Out Looks", "going-out-looks", "Sparkle after dark."],
  ["Accessories & Extras", "accessories-extras", "The little things that finish a look."],
  ["Under R200", "under-r200", "Pretty, for less."],
  ["Trending Now", "trending-now", "What the girlies are loving."],
];

type P = [string, string, string, string, number, number, number, number, number, number, string[], string[], string, string[], boolean];
// title, slug, category, art, supplierCost, sourcing, markup, price, dmin, dmax, sizes, colours, supplier, collections, featured
const PRODUCTS: P[] = [
  ["Pink Satin Bow Bag", "pink-satin-bow-bag", "Bags", "art:bag:#f19bbd", 140, 35, 120, 389, 10, 18, [], ["Blush", "Ivory"], "SHEIN", ["the-pretty-edit", "pink-obsession", "trending-now"], true],
  ["Rose Gold Jewellery Set", "rose-gold-jewellery-set", "Jewellery", "art:jewel:#e7b49a", 90, 25, 110, 249, 12, 20, [], ["Rose Gold"], "Temu", ["little-luxuries", "the-pretty-edit"], true],
  ["Cherry Print Shoulder Bag", "cherry-print-shoulder-bag", "Bags", "art:cherrybag:#fff0f4", 120, 35, 120, 339, 10, 18, [], ["Cream/Cherry"], "SHEIN", ["main-character-energy", "trending-now"], false],
  ["Pink Ballet Flats", "pink-ballet-flats", "Shoes", "art:flats:#f4a6c0", 180, 40, 100, 449, 5, 9, ["3", "4", "5", "6", "7", "8"], ["Ballet Pink", "Black"], "Mr Price", ["everyday-girly", "pink-obsession"], true],
  ["Satin Makeup Pouch", "satin-makeup-pouch", "Beauty", "art:pouch:#e8a0b8", 45, 20, 120, 149, 12, 21, [], ["Blush", "Lilac", "Champagne"], "Temu", ["under-r200", "accessories-extras"], false],
  ["Heart Pendant Necklace", "heart-pendant-necklace", "Jewellery", "art:heart:#d4af37", 55, 20, 130, 179, 12, 20, [], ["Gold Tone", "Silver Tone"], "Temu", ["under-r200", "the-pretty-edit"], false],
  ["Pink Knit Cardigan", "pink-knit-cardigan", "Clothing", "art:cardigan:#f6b3c9", 160, 40, 100, 399, 10, 18, ["XS", "S", "M", "L", "XL"], ["Candy Pink", "Cream"], "SHEIN", ["everyday-girly", "pink-obsession"], true],
  ["Rhinestone Hair Accessories", "rhinestone-hair-accessories", "Hair Accessories", "art:sparkle:#ffd6e6", 50, 20, 120, 159, 12, 21, [], ["Silver", "Pink"], "Temu", ["going-out-looks", "under-r200"], false],
  ["Pearl Hair Claw Set", "pearl-hair-claw-set", "Hair Accessories", "art:claw:#fff4f8", 40, 15, 120, 129, 3, 6, [], ["Pearl"], "PEP", ["everyday-girly", "under-r200"], false],
  ["Satin Bow Headband", "satin-bow-headband", "Hair Accessories", "art:headband:#d6246e", 35, 15, 120, 99, 3, 6, [], ["Hot Pink", "Black", "Baby Pink"], "PEP", ["accessories-extras", "under-r200", "trending-now"], false],
  ["Pink Mini Shoulder Bag", "pink-mini-shoulder-bag", "Bags", "art:minibag:#ff3d8b", 130, 35, 110, 349, 7, 14, [], ["Hot Pink", "Baby Pink"], "Mr Price", ["main-character-energy", "pink-obsession"], true],
  ["Glitter Evening Clutch", "glitter-evening-clutch", "Bags", "art:clutch:#c9a8ff", 150, 40, 110, 399, 14, 24, [], ["Silver Glitter", "Rose Glitter"], "SHEIN", ["going-out-looks", "little-luxuries"], true],
];

const DESC: Record<string, string> = {
  "pink-satin-bow-bag": "A soft satin handbag finished with an oversized bow. The kind of bag that makes a plain outfit look intentional. Fits your phone, lip gloss and keys.",
  "rose-gold-jewellery-set": "A matching rose-gold-tone set of necklace, bracelet and stud earrings. Fashion jewellery (plated metal). Keep dry for the longest shine.",
  "cherry-print-shoulder-bag": "Playful cherry print on a cream base with a slim shoulder strap. Sweet with denim, cute with a sundress.",
  "pink-ballet-flats": "Rounded-toe ballet flats with a dainty bow. Soft-touch upper and padded insole for all-day girly errands. SA sizing.",
  "satin-makeup-pouch": "A slouchy satin pouch for your everyday makeup essentials. Zip close, wipe-clean lining.",
  "heart-pendant-necklace": "A dainty puffed heart pendant on a fine chain. Fashion jewellery, adjustable length.",
  "pink-knit-cardigan": "Cropped, cosy knit cardigan with pearl-look buttons. Layer over a cami for that soft-girl look.",
  "rhinestone-hair-accessories": "A set of sparkly rhinestone clips and slides to elevate any hairstyle for nights out.",
  "pearl-hair-claw-set": "A 3-piece set of faux-pearl claw clips in mixed sizes. Available locally for faster delivery.",
  "satin-bow-headband": "A padded satin headband with a sweet bow. Effortless glam for everyday.",
  "pink-mini-shoulder-bag": "A structured mini shoulder bag in a bold pink. Main character energy in bag form.",
  "glitter-evening-clutch": "Fully glittered evening clutch with a detachable chain. Made for photos under party lights.",
};

let seeded: Promise<void> | null = null;

export function ensureSeed() {
  if (!seeded) seeded = doSeed().catch((e) => { seeded = null; throw e; });
  return seeded;
}

async function doSeed() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(collections);
  if (c === 0) {
    await db.insert(collections).values([...COLLECTIONS, ["Little Luxuries", "little-luxuries", "Treat-yourself pieces."]].map(([name, slug, description], i) => ({ name, slug, description, sortOrder: i }))).onConflictDoNothing();
  }
  const [{ p }] = await db.select({ p: sql<number>`count(*)::int` }).from(products);
  if (p === 0) {
    await db.insert(products).values(PRODUCTS.map(([title, slug, category, art, cost, src, markup, price, dmin, dmax, sizes, colours, supplier, cols, featured], i) => ({
      title, slug, category, images: [art], supplierName: supplier, supplierUrl: "https://example.com/supplier-listing",
      supplierCost: String(cost), sourcingCost: String(src), markupPercent: String(markup), price: String(price),
      compareAtPrice: i % 4 === 0 ? String(price + 80) : null,
      deliveryMin: dmin, deliveryMax: dmax, sizes, colours, collectionSlugs: cols, featured,
      stockStatus: supplier === "PEP" ? "local" : i === 7 ? "low" : "supplier",
      status: "published", isDemo: true, description: DESC[slug] ?? "",
      specs: { Material: category === "Jewellery" ? "Plated alloy (fashion jewellery)" : category === "Shoes" ? "Faux leather upper" : "Polyester / satin blend", Note: "Demonstration product" },
      salesCount: 0, createdAt: new Date(Date.now() - i * 86400000),
    }))).onConflictDoNothing();
  }
  await db.insert(settings).values({ key: "site", value: DEFAULT_SETTINGS }).onConflictDoNothing();
  await db.insert(policies).values(DEFAULT_POLICIES).onConflictDoNothing();
  await db.insert(discountCodes).values({ code: "GIRLIES10", type: "percent", value: "10", minSubtotal: "300" }).onConflictDoNothing();
}
