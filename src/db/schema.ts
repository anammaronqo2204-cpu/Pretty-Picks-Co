import { pgTable, serial, text, integer, boolean, timestamp, jsonb, numeric, customType, index } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default("Admin"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 of token
  adminId: integer("admin_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export type Variant = { name: string; priceAdjust?: number; available?: boolean };

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  specs: jsonb("specs").$type<Record<string, string>>().notNull().default({}),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  category: text("category").notNull().default("Accessories"),
  collectionSlugs: jsonb("collection_slugs").$type<string[]>().notNull().default([]),
  brand: text("brand").notNull().default(""),
  // PRIVATE fields
  supplierName: text("supplier_name").notNull().default(""),
  supplierUrl: text("supplier_url").notNull().default(""),
  supplierCost: numeric("supplier_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  sourcingCost: numeric("sourcing_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  markupPercent: numeric("markup_percent", { precision: 6, scale: 2 }).notNull().default("100"),
  internalNotes: text("internal_notes").notNull().default(""),
  // public pricing
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  deliveryMin: integer("delivery_min").notNull().default(7),
  deliveryMax: integer("delivery_max").notNull().default(14),
  sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
  colours: jsonb("colours").$type<string[]>().notNull().default([]),
  variants: jsonb("variants").$type<Variant[]>().notNull().default([]),
  stockStatus: text("stock_status").notNull().default("supplier"), // supplier | local | low | unavailable
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull().default("draft"), // draft | published | archived
  publishAt: timestamp("publish_at"),
  isDemo: boolean("is_demo").notNull().default(false),
  salesCount: integer("sales_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  accessToken: text("access_token").notNull(),
  idempotencyKey: text("idempotency_key").unique(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  suburb: text("suburb").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  instructions: text("instructions").notNull().default(""),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountCode: text("discount_code"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  shipping: numeric("shipping", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  transactionFee: numeric("transaction_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: text("payment_method").notNull().default("eft"),
  paymentStatus: text("payment_status").notNull().default("awaiting_proof"),
  status: text("status").notNull().default("awaiting_payment_verification"),
  internalNotes: text("internal_notes").notNull().default(""),
  refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"),
  title: text("title").notNull(),
  size: text("size"),
  colour: text("colour"),
  variant: text("variant"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  supplierName: text("supplier_name").notNull().default(""),
  deliveryMin: integer("delivery_min").notNull(),
  deliveryMax: integer("delivery_max").notNull(),
  fulfilmentStatus: text("fulfilment_status").notNull().default("order_placed"),
  trackingNumber: text("tracking_number").notNull().default(""),
  supplierOrderRef: text("supplier_order_ref").notNull().default(""),
}, (t) => [index("oi_order_idx").on(t.orderId)]);

export const paymentProofs = pgTable("payment_proofs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  mediaId: integer("media_id").notNull(),
  fileName: text("file_name").notNull(),
  sha256: text("sha256").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reviewNote: text("review_note").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentEvents = pgTable("payment_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  actor: text("actor").notNull(),
  event: text("event").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const itemRequests = pgTable("item_requests", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  imageMediaId: integer("image_media_id"),
  colour: text("colour").notNull().default(""),
  size: text("size").notNull().default(""),
  budget: numeric("budget", { precision: 10, scale: 2 }),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("new"),
  supplierName: text("supplier_name").notNull().default(""),
  supplierUrl: text("supplier_url").notNull().default(""),
  supplierCost: numeric("supplier_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  sourcingCost: numeric("sourcing_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  markupPercent: numeric("markup_percent", { precision: 6, scale: 2 }).notNull().default("80"),
  quotePrice: numeric("quote_price", { precision: 10, scale: 2 }),
  quoteMessage: text("quote_message").notNull().default(""),
  log: jsonb("log").$type<{ at: string; text: string }[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percent"), // percent | fixed
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  minSubtotal: numeric("min_subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  active: boolean("active").notNull().default(true),
});

export const policies = pgTable("policies", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // contact | newsletter | notification
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  body: text("body").notNull().default(""),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
