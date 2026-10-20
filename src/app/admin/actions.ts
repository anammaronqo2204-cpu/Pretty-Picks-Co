"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { admins, products, orders, orderItems, paymentProofs, paymentEvents, itemRequests, collections, settings, policies, discountCodes, media, messages } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createSession, destroySession, hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import { rateLimit, isEmail, str, safeEqual, sniffMime, ALLOWED_IMG, MAX_UPLOAD } from "@/lib/security";
import { slugify, suggestedPrice } from "@/lib/format";
import { getSettings } from "@/lib/data";
import { ORDER_STATUSES, PAYMENT_STATUSES, FULFILMENT_STEPS, REQUEST_STATUSES, STOCK_STATUSES } from "@/lib/constants";

const s = (fd: FormData, k: string, max = 500) => str(fd.get(k), max);
const num = (fd: FormData, k: string, d = 0) => { const v = Number(fd.get(k)); return Number.isFinite(v) && v >= 0 ? v : d; };
const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 40);

// ---------- auth ----------
export async function loginAction(fd: FormData) {
  if (!(await rateLimit("login", 5, 15 * 60_000))) redirect("/admin/login?error=Too+many+attempts.+Try+again+in+15+minutes.");
  const email = s(fd, "email", 200).toLowerCase(), pw = String(fd.get("password") ?? "");
  const a = (await db.select().from(admins).where(eq(admins.email, email)).limit(1))[0];
  if (!a || !verifyPassword(pw, a.passwordHash)) redirect("/admin/login?error=Invalid+email+or+password");
  await createSession(a.id);
  redirect("/admin");
}
export async function logoutAction() { await destroySession(); redirect("/admin/login"); }

export async function setupAction(fd: FormData) {
  if (!(await rateLimit("setup", 5, 15 * 60_000))) redirect("/admin/setup?error=Too+many+attempts");
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(admins);
  if (c > 0) redirect("/admin/login");
  const need = process.env.ADMIN_SETUP_TOKEN;
  if (need && !safeEqual(need, String(fd.get("setupToken") ?? ""))) redirect("/admin/setup?error=Invalid+setup+token");
  const email = s(fd, "email", 200).toLowerCase(), pw = String(fd.get("password") ?? ""), name = s(fd, "name", 80) || "Admin";
  if (!isEmail(email)) redirect("/admin/setup?error=Enter+a+valid+email");
  if (pw.length < 10) redirect("/admin/setup?error=Password+must+be+at+least+10+characters");
  const [a] = await db.insert(admins).values({ email, name, passwordHash: hashPassword(pw) }).returning();
  await createSession(a.id);
  redirect("/admin");
}

export async function addAdminAction(fd: FormData) {
  await requireAdmin();
  const email = s(fd, "email", 200).toLowerCase(), pw = String(fd.get("password") ?? "");
  if (!isEmail(email) || pw.length < 10) redirect("/admin/settings?error=Valid+email+and+10%2B+char+password+required");
  await db.insert(admins).values({ email, name: s(fd, "name", 80) || "Admin", passwordHash: hashPassword(pw) }).onConflictDoNothing();
  redirect("/admin/settings?ok=Admin+added");
}

// ---------- uploads ----------
export async function uploadImageAction(fd: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const f = fd.get("file");
  if (!(f instanceof File) || !f.size) return { error: "No file" };
  if (f.size > MAX_UPLOAD) return { error: "Max 5MB" };
  const buf = Buffer.from(await f.arrayBuffer());
  const mime = sniffMime(buf);
  if (!mime || !ALLOWED_IMG.includes(mime)) return { error: "JPG, PNG, WebP or GIF only" };
  const [m] = await db.insert(media).values({ mime, data: buf, isPublic: true }).returning({ id: media.id });
  return { url: `/api/media/${m.id}` };
}

// ---------- products ----------
export async function saveProductAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const title = s(fd, "title", 150);
  if (!title) redirect(`/admin/products/${id ?? "new"}?error=Title+is+required`);
  const cost = num(fd, "supplierCost"), sourcing = num(fd, "sourcingCost"), markup = num(fd, "markupPercent", 100);
  const priceIn = num(fd, "price");
  const price = priceIn > 0 ? priceIn : suggestedPrice(cost, sourcing, markup);
  const dmin = Math.max(1, Math.floor(num(fd, "deliveryMin", 7))), dmax = Math.max(dmin, Math.floor(num(fd, "deliveryMax", 14)));
  let specs: Record<string, string> = {};
  s(fd, "specs", 3000).split("\n").forEach((l) => { const [k, ...v] = l.split(":"); if (k?.trim() && v.length) specs[k.trim().slice(0, 60)] = v.join(":").trim().slice(0, 200); });
  if (Object.keys(specs).length > 30) specs = {};
  const variants = s(fd, "variants", 2000).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 30).map((l) => {
    const [name, adj, avail] = l.split("|").map((x) => x.trim());
    return { name: name.slice(0, 60), priceAdjust: Number(adj) || 0, available: avail !== "no" };
  });
  const stock = s(fd, "stockStatus", 20);
  const status = ["draft", "published", "archived"].includes(s(fd, "status")) ? s(fd, "status") : "draft";
  const publishAtRaw = s(fd, "publishAt", 30);
  const compare = num(fd, "compareAtPrice");
  const values = {
    title, slug: slugify(s(fd, "slug", 100) || title) || `product-${Date.now()}`, description: s(fd, "description", 5000), specs,
    images: s(fd, "images", 4000).split("\n").map((x) => x.trim()).filter((x) => /^(https?:\/\/|\/api\/media\/|art:)/.test(x)).slice(0, 10),
    category: s(fd, "category", 60) || "Accessories", collectionSlugs: fd.getAll("collections").map(String).slice(0, 20), brand: s(fd, "brand", 80),
    supplierName: s(fd, "supplierName", 80), supplierUrl: s(fd, "supplierUrl", 1000), supplierCost: String(cost), sourcingCost: String(sourcing),
    markupPercent: String(markup), price: String(price), compareAtPrice: compare > price ? String(compare) : null, deliveryMin: dmin, deliveryMax: dmax,
    sizes: list(s(fd, "sizes", 500)), colours: list(s(fd, "colours", 500)), variants,
    stockStatus: stock in STOCK_STATUSES ? stock : "supplier", featured: fd.get("featured") === "on", status,
    publishAt: publishAtRaw ? new Date(publishAtRaw) : null, internalNotes: s(fd, "internalNotes", 5000), isDemo: fd.get("isDemo") === "on", updatedAt: new Date(),
  };
  try {
    if (id) await db.update(products).set(values).where(eq(products.id, id));
    else { const [p] = await db.insert(products).values(values).returning({ id: products.id }); revalidatePath("/"); redirect(`/admin/products/${p.id}?ok=Product+created`); }
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    redirect(`/admin/products/${id ?? "new"}?error=Could+not+save+(slug+may+already+exist)`);
  }
  revalidatePath("/");
  redirect(`/admin/products/${id}?ok=Saved`);
}
export async function setProductStatusAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id")), status = s(fd, "status");
  if (["draft", "published", "archived"].includes(status)) await db.update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/admin/products");
}

// ---------- orders ----------
async function audit(orderId: number, actor: string, event: string, detail = "") { await db.insert(paymentEvents).values({ orderId, actor, event, detail: detail.slice(0, 500) }); }

export async function reviewProofAction(fd: FormData) {
  const a = await requireAdmin();
  const proofId = Number(fd.get("proofId")), decision = s(fd, "decision"), note = s(fd, "note", 300);
  const p = (await db.select().from(paymentProofs).where(eq(paymentProofs.id, proofId)).limit(1))[0];
  if (!p) return;
  if (decision === "approve") {
    if (fd.get("fundsConfirmed") !== "on") redirect(`/admin/orders/${p.orderId}?error=Tick+the+box+confirming+funds+have+cleared+in+the+bank+account`);
    await db.transaction(async (tx) => {
      await tx.update(paymentProofs).set({ status: "approved", reviewNote: note }).where(eq(paymentProofs.id, proofId));
      await tx.update(orders).set({ paymentStatus: "verified", status: "payment_confirmed", updatedAt: new Date() }).where(eq(orders.id, p.orderId));
      await tx.update(orderItems).set({ fulfilmentStatus: "payment_verified" }).where(and(eq(orderItems.orderId, p.orderId), eq(orderItems.fulfilmentStatus, "order_placed")));
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, p.orderId));
      for (const i of items) if (i.productId) await tx.update(products).set({ salesCount: sql`${products.salesCount} + ${i.quantity}` }).where(eq(products.id, i.productId));
    });
    await audit(p.orderId, a.email, "payment_verified", `Proof #${proofId} approved; funds confirmed in bank. ${note}`);
  } else {
    await db.update(paymentProofs).set({ status: "rejected", reviewNote: note }).where(eq(paymentProofs.id, proofId));
    const pending = await db.select({ id: paymentProofs.id }).from(paymentProofs).where(and(eq(paymentProofs.orderId, p.orderId), eq(paymentProofs.status, "pending")));
    if (!pending.length) await db.update(orders).set({ paymentStatus: "rejected", updatedAt: new Date() }).where(eq(orders.id, p.orderId));
    await audit(p.orderId, a.email, "proof_rejected", `Proof #${proofId}: ${note}`);
  }
  redirect(`/admin/orders/${p.orderId}?ok=Updated`);
}

export async function verifyWithoutProofAction(fd: FormData) {
  const a = await requireAdmin();
  const id = Number(fd.get("orderId"));
  if (fd.get("fundsConfirmed") !== "on") redirect(`/admin/orders/${id}?error=Confirm+funds+have+cleared+first`);
  await db.update(orders).set({ paymentStatus: "verified", status: "payment_confirmed", updatedAt: new Date() }).where(eq(orders.id, id));
  await db.update(orderItems).set({ fulfilmentStatus: "payment_verified" }).where(and(eq(orderItems.orderId, id), eq(orderItems.fulfilmentStatus, "order_placed")));
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  for (const i of items) if (i.productId) await db.update(products).set({ salesCount: sql`${products.salesCount} + ${i.quantity}` }).where(eq(products.id, i.productId));
  await audit(id, a.email, "payment_verified", "Verified directly from bank statement (no proof uploaded)");
  redirect(`/admin/orders/${id}?ok=Payment+verified`);
}

export async function updateOrderAction(fd: FormData) {
  const a = await requireAdmin();
  const id = Number(fd.get("orderId"));
  const o = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!o) return;
  const status = s(fd, "status"), paymentStatus = s(fd, "paymentStatus");
  const supplierStatuses = ["ordered_from_supplier", "processing", "in_transit", "arrived_for_checking", "ready_for_delivery", "out_for_delivery", "delivered"];
  if (supplierStatuses.includes(status) && o.paymentStatus !== "verified" && paymentStatus !== "verified")
    redirect(`/admin/orders/${id}?error=Verify+payment+before+starting+supplier+fulfilment`);
  const patch: Partial<typeof orders.$inferInsert> = { internalNotes: s(fd, "internalNotes", 5000), refundAmount: String(num(fd, "refundAmount")), updatedAt: new Date() };
  if (status in ORDER_STATUSES) patch.status = status;
  if (paymentStatus in PAYMENT_STATUSES && paymentStatus !== o.paymentStatus) {
    if (paymentStatus === "verified") redirect(`/admin/orders/${id}?error=Use+the+payment+verification+panel+to+verify+payments`);
    patch.paymentStatus = paymentStatus;
    await audit(id, a.email, "payment_status_changed", `${o.paymentStatus} → ${paymentStatus}`);
  }
  if (patch.status && patch.status !== o.status) await audit(id, a.email, "order_status_changed", `${o.status} → ${patch.status}`);
  await db.update(orders).set(patch).where(eq(orders.id, id));
  if (status === "cancelled") await db.update(orderItems).set({ fulfilmentStatus: "cancelled" }).where(eq(orderItems.orderId, id));
  redirect(`/admin/orders/${id}?ok=Order+updated`);
}

export async function updateItemAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("itemId")), orderId = Number(fd.get("orderId"));
  const st = s(fd, "fulfilmentStatus");
  const o = (await db.select({ ps: orders.paymentStatus }).from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  const afterPayment = ["placed_with_supplier", "supplier_dispatched", "in_transit", "arrived_for_checking", "checked", "delivered"];
  if (afterPayment.includes(st) && o?.ps !== "verified") redirect(`/admin/orders/${orderId}?error=Payment+must+be+verified+before+ordering+from+supplier`);
  await db.update(orderItems).set({ fulfilmentStatus: st in FULFILMENT_STEPS ? st : "order_placed", trackingNumber: s(fd, "trackingNumber", 100), supplierOrderRef: s(fd, "supplierOrderRef", 100) }).where(and(eq(orderItems.id, id), eq(orderItems.orderId, orderId)));
  redirect(`/admin/orders/${orderId}?ok=Item+updated`);
}

// ---------- requests ----------
export async function updateRequestAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const r = (await db.select().from(itemRequests).where(eq(itemRequests.id, id)).limit(1))[0];
  if (!r) return;
  const status = s(fd, "status");
  const cost = num(fd, "supplierCost"), sourcing = num(fd, "sourcingCost"), markup = num(fd, "markupPercent", 80), qp = num(fd, "quotePrice");
  const log = [...r.log];
  if (status !== r.status && status in REQUEST_STATUSES) log.push({ at: new Date().toISOString(), text: `Status → ${REQUEST_STATUSES[status]}` });
  const note = s(fd, "logNote", 1000);
  if (note) log.push({ at: new Date().toISOString(), text: note });
  await db.update(itemRequests).set({
    status: status in REQUEST_STATUSES ? status : r.status, supplierName: s(fd, "supplierName", 80), supplierUrl: s(fd, "supplierUrl", 1000),
    supplierCost: String(cost), sourcingCost: String(sourcing), markupPercent: String(markup),
    quotePrice: String(qp > 0 ? qp : suggestedPrice(cost, sourcing, markup)), quoteMessage: s(fd, "quoteMessage", 2000), log: log.slice(-100),
  }).where(eq(itemRequests.id, id));
  redirect(`/admin/requests/${id}?ok=Saved`);
}

// ---------- collections ----------
export async function saveCollectionAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id")) || null, name = s(fd, "name", 80);
  if (fd.get("delete") === "1" && id) { await db.delete(collections).where(eq(collections.id, id)); revalidatePath("/"); redirect("/admin/collections?ok=Deleted"); }
  if (!name) redirect("/admin/collections?error=Name+required");
  const v = { name, slug: slugify(s(fd, "slug", 80) || name), description: s(fd, "description", 200), sortOrder: Math.floor(num(fd, "sortOrder")), active: fd.get("active") === "on" };
  try { if (id) await db.update(collections).set(v).where(eq(collections.id, id)); else await db.insert(collections).values(v); }
  catch { redirect("/admin/collections?error=Slug+already+used"); }
  revalidatePath("/");
  redirect("/admin/collections?ok=Saved");
}

// ---------- settings / discounts / policies / messages ----------
export async function saveSettingsAction(fd: FormData) {
  await requireAdmin();
  const cur = await getSettings();
  const v = {
    ...cur, businessEmail: s(fd, "businessEmail", 200), whatsapp: s(fd, "whatsapp", 20).replace(/\D/g, ""), instagram: s(fd, "instagram", 300), tiktok: s(fd, "tiktok", 300),
    shippingFee: num(fd, "shippingFee", 99), freeShippingOver: num(fd, "freeShippingOver", 900), eftFeePerOrder: num(fd, "eftFeePerOrder"),
    bank: { bankName: s(fd, "bankName", 80), accountName: s(fd, "accountName", 120), accountNumber: s(fd, "accountNumber", 30), branchCode: s(fd, "branchCode", 20), accountType: s(fd, "accountType", 40), verified: fd.get("bankVerified") === "on" },
  };
  await db.insert(settings).values({ key: "site", value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
  revalidatePath("/");
  redirect("/admin/settings?ok=Settings+saved");
}
export async function saveDiscountAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  if (fd.get("delete") === "1" && id) { await db.delete(discountCodes).where(eq(discountCodes.id, id)); redirect("/admin/settings?ok=Code+deleted"); }
  const code = s(fd, "code", 30).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) redirect("/admin/settings?error=Code+required");
  const v = { code, type: s(fd, "type") === "fixed" ? "fixed" : "percent", value: String(num(fd, "value")), minSubtotal: String(num(fd, "minSubtotal")), active: fd.get("active") === "on" };
  try { if (id) await db.update(discountCodes).set(v).where(eq(discountCodes.id, id)); else await db.insert(discountCodes).values(v); }
  catch { redirect("/admin/settings?error=Code+already+exists"); }
  redirect("/admin/settings?ok=Code+saved");
}
export async function savePolicyAction(fd: FormData) {
  await requireAdmin();
  const slug = slugify(s(fd, "slug", 60)), title = s(fd, "title", 120), body = s(fd, "body", 30000);
  if (!slug || !title) redirect("/admin/policies?error=Title+and+slug+required");
  await db.insert(policies).values({ slug, title, body }).onConflictDoUpdate({ target: policies.slug, set: { title, body, updatedAt: new Date() } });
  revalidatePath(`/policies/${slug}`);
  redirect(`/admin/policies?ok=Saved&edit=${slug}`);
}
export async function markReadAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (fd.get("all") === "1") await db.update(messages).set({ read: true });
  else await db.update(messages).set({ read: true }).where(eq(messages.id, id));
  revalidatePath("/admin/messages");
}
