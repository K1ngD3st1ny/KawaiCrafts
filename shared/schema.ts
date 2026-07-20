import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // kept for backward compat — no longer written
  googleId: text("google_id").unique(), // Google OAuth user ID
  role: text("role", { enum: ["customer", "admin"] })
    .notNull()
    .default("customer"),
  // ── Extended profile fields ──────────────────────────────────────────────
  firstName: text("first_name"),
  middleName: text("middle_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  dateOfBirth: text("date_of_birth"), // stored as YYYY-MM-DD string
  gender: text("gender", { enum: ["male", "female", "non_binary", "prefer_not_to_say"] }),
  phoneNumber: text("phone_number"),
  alternatePhoneNumber: text("alternate_phone_number"),
  profileImageUrl: text("profile_image_url"),
  // ────────────────────────────────────────────────────────────────────────
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).optional(),
  middleName: z.string().max(50).optional().nullable(),
  lastName: z.string().min(1, "Last name is required").max(50).optional(),
  displayName: z.string().max(50).optional().nullable(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional().nullable(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]).optional().nullable(),
  phoneNumber: z.string().regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number").optional().nullable(),
  alternatePhoneNumber: z.string().regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number").optional().nullable(),
  name: z.string().min(2).max(100).optional(),
});

export type User = typeof users.$inferSelect;

// ─── Addresses ────────────────────────────────────────────────────────────────

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    landmark: text("landmark"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull().default("India"),
    postalCode: text("postal_code").notNull(),
    addressType: text("address_type", { enum: ["home", "work", "other"] })
      .notNull()
      .default("home"),
    isDefaultShipping: boolean("is_default_shipping").notNull().default(false),
    isDefaultBilling: boolean("is_default_billing").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_addresses_user_id").on(table.userId),
    index("idx_addresses_default_shipping").on(table.userId, table.isDefaultShipping),
    index("idx_addresses_default_billing").on(table.userId, table.isDefaultBilling),
  ]
);

export const insertAddressSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  phoneNumber: z.string().regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number"),
  addressLine1: z.string().min(5, "Address is required").max(200),
  addressLine2: z.string().max(200).optional().nullable(),
  landmark: z.string().max(100).optional().nullable(),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  country: z.string().min(2, "Country is required").max(100).default("India"),
  postalCode: z.string().regex(/^\d{4,10}$/, "Invalid postal code"),
  addressType: z.enum(["home", "work", "other"]).default("home"),
  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling: z.boolean().default(false),
});

export const updateAddressSchema = insertAddressSchema.partial();

export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;

// ─── Anime Series ────────────────────────────────────────────────────────────

export const animeSeries = pgTable("anime_series", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const insertAnimeSeriesSchema = createInsertSchema(animeSeries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAnimeSeriesSchema = insertAnimeSeriesSchema.partial();

export type InsertAnimeSeries = z.infer<typeof insertAnimeSeriesSchema>;
export type AnimeSeries = typeof animeSeries.$inferSelect;

// ─── Products ────────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    animeSeries: text("anime_series").notNull(),
    characterName: text("character_name").notNull(),
    difficulty: text("difficulty", {
      enum: ["easy", "medium", "hard", "expert"],
    })
      .notNull()
      .default("medium"),
    pageCount: integer("page_count").notNull().default(1),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    pdfUrl: text("pdf_url"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    popularity: integer("popularity").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_products_slug").on(table.slug),
    index("idx_products_anime_series").on(table.animeSeries),
    index("idx_products_active").on(table.active),
    index("idx_products_featured").on(table.featured),
  ]
);

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProductSchema = insertProductSchema.partial();

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// ─── Product Images (Gallery) ────────────────────────────────────────────────

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_product_images_product_id").on(table.productId),
    index("idx_product_images_display_order").on(
      table.productId,
      table.displayOrder
    ),
  ]
);

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
  createdAt: true,
});

export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type ProductImage = typeof productImages.$inferSelect;

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    paymentStatus: text("payment_status", {
      enum: ["pending", "completed", "failed", "refunded"],
    })
      .notNull()
      .default("pending"),
    paymentIntentId: text("payment_intent_id"), // Future Stripe support
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_orders_user_id").on(table.userId)]
);

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// ─── Order Items ─────────────────────────────────────────────────────────────

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index("idx_order_items_order_id").on(table.orderId)]
);

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// ─── Downloads ───────────────────────────────────────────────────────────────

export const downloads = pgTable(
  "downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    downloadCount: integer("download_count").notNull().default(0),
    lastDownloadedAt: timestamp("last_downloaded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_downloads_user_id").on(table.userId),
    index("idx_downloads_user_product").on(table.userId, table.productId),
  ]
);

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  createdAt: true,
});

export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;

// ─── Wishlists ───────────────────────────────────────────────────────────────

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_wishlists_user_id").on(table.userId),
    index("idx_wishlists_product_id").on(table.productId),
    uniqueIndex("idx_wishlists_user_product_unique").on(table.userId, table.productId),
  ]
);

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true,
});

export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlists.$inferSelect;
