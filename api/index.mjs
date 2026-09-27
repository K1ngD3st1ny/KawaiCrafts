var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/entry.ts
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";

// server/routes.ts
import { createServer } from "http";

// server/routes/googleAuth.ts
import { Router } from "express";
import { Google, generateState, generateCodeVerifier, decodeIdToken } from "arctic";

// server/db.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  addresses: () => addresses,
  animeSeries: () => animeSeries,
  downloads: () => downloads,
  insertAddressSchema: () => insertAddressSchema,
  insertAnimeSeriesSchema: () => insertAnimeSeriesSchema,
  insertDownloadSchema: () => insertDownloadSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertProductImageSchema: () => insertProductImageSchema,
  insertProductSchema: () => insertProductSchema,
  insertWishlistSchema: () => insertWishlistSchema,
  orderItems: () => orderItems,
  orders: () => orders,
  productImages: () => productImages,
  products: () => products,
  updateAddressSchema: () => updateAddressSchema,
  updateAnimeSeriesSchema: () => updateAnimeSeriesSchema,
  updateProductSchema: () => updateProductSchema,
  updateProfileSchema: () => updateProfileSchema,
  users: () => users,
  wishlists: () => wishlists
});
import {
  pgTable,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  uuid,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  // kept for backward compat — no longer written
  googleId: text("google_id").unique(),
  // Google OAuth user ID
  role: text("role", { enum: ["customer", "admin"] }).notNull().default("customer"),
  // ── Extended profile fields ──────────────────────────────────────────────
  firstName: text("first_name"),
  middleName: text("middle_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  dateOfBirth: text("date_of_birth"),
  // stored as YYYY-MM-DD string
  gender: text("gender", { enum: ["male", "female", "non_binary", "prefer_not_to_say"] }),
  phoneNumber: text("phone_number"),
  alternatePhoneNumber: text("alternate_phone_number"),
  profileImageUrl: text("profile_image_url"),
  // ────────────────────────────────────────────────────────────────────────
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).optional(),
  middleName: z.string().max(50).optional().nullable(),
  lastName: z.string().min(1, "Last name is required").max(50).optional(),
  displayName: z.string().max(50).optional().nullable(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional().nullable(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]).optional().nullable(),
  phoneNumber: z.string().regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number").optional().nullable(),
  alternatePhoneNumber: z.string().regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number").optional().nullable(),
  name: z.string().min(2).max(100).optional()
});
var addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    landmark: text("landmark"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull().default("India"),
    postalCode: text("postal_code").notNull(),
    addressType: text("address_type", { enum: ["home", "work", "other"] }).notNull().default("home"),
    isDefaultShipping: boolean("is_default_shipping").notNull().default(false),
    isDefaultBilling: boolean("is_default_billing").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    index("idx_addresses_user_id").on(table.userId),
    index("idx_addresses_default_shipping").on(table.userId, table.isDefaultShipping),
    index("idx_addresses_default_billing").on(table.userId, table.isDefaultBilling)
  ]
);
var insertAddressSchema = z.object({
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
  isDefaultBilling: z.boolean().default(false)
});
var updateAddressSchema = insertAddressSchema.partial();
var animeSeries = pgTable("anime_series", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var insertAnimeSeriesSchema = createInsertSchema(animeSeries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var updateAnimeSeriesSchema = insertAnimeSeriesSchema.partial();
var products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    animeSeries: text("anime_series").notNull(),
    characterName: text("character_name").notNull(),
    difficulty: text("difficulty", {
      enum: ["easy", "medium", "hard", "expert"]
    }).notNull().default("medium"),
    pageCount: integer("page_count").notNull().default(1),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    pdfUrl: text("pdf_url"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    popularity: integer("popularity").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    index("idx_products_slug").on(table.slug),
    index("idx_products_anime_series").on(table.animeSeries),
    index("idx_products_active").on(table.active),
    index("idx_products_featured").on(table.featured)
  ]
);
var insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var updateProductSchema = insertProductSchema.partial();
var productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    index("idx_product_images_product_id").on(table.productId),
    index("idx_product_images_display_order").on(
      table.productId,
      table.displayOrder
    )
  ]
);
var insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
  createdAt: true
});
var orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    paymentStatus: text("payment_status", {
      enum: ["pending", "completed", "failed", "refunded"]
    }).notNull().default("pending"),
    paymentIntentId: text("payment_intent_id"),
    // Future Stripe support
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("idx_orders_user_id").on(table.userId)]
);
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull()
  },
  (table) => [index("idx_order_items_order_id").on(table.orderId)]
);
var insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});
var downloads = pgTable(
  "downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    downloadCount: integer("download_count").notNull().default(0),
    lastDownloadedAt: timestamp("last_downloaded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    index("idx_downloads_user_id").on(table.userId),
    index("idx_downloads_user_product").on(table.userId, table.productId)
  ]
);
var insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  createdAt: true
});
var wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    index("idx_wishlists_user_id").on(table.userId),
    index("idx_wishlists_product_id").on(table.productId),
    uniqueIndex("idx_wishlists_user_product_unique").on(table.userId, table.productId)
  ]
);
var insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true
});

// server/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Please configure your database connection."
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/routes/googleAuth.ts
import { eq } from "drizzle-orm";

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret";
function generateToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  return null;
}
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });
}

// server/routes/googleAuth.ts
var router = Router();
function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment"
    );
  }
  return new Google(clientId, clientSecret, callbackUrl);
}
function resolveRole(email) {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  return adminEmail && email.toLowerCase() === adminEmail ? "admin" : "customer";
}
router.get("/google", (_req, res) => {
  try {
    const google = getGoogleClient();
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email"
    ]);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60 * 1e3
      // 5 minutes
    };
    res.cookie("oauth_state", state, cookieOptions);
    res.cookie("oauth_code_verifier", codeVerifier, cookieOptions);
    res.redirect(url.toString());
  } catch (err) {
    console.error("Google OAuth init error:", err.message);
    res.redirect("/login?error=oauth_config");
  }
});
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      console.warn("Google OAuth denied:", error);
      return res.redirect("/login?error=oauth_denied");
    }
    const storedState = req.cookies?.oauth_state;
    const storedCodeVerifier = req.cookies?.oauth_code_verifier;
    if (!state || !storedState || state !== storedState || !storedCodeVerifier) {
      console.warn("OAuth state or code verifier mismatch");
      return res.redirect("/login?error=oauth_state");
    }
    res.clearCookie("oauth_state");
    res.clearCookie("oauth_code_verifier");
    if (!code) {
      return res.redirect("/login?error=oauth_no_code");
    }
    const google = getGoogleClient();
    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
    const claims = decodeIdToken(tokens.idToken());
    const { sub: googleId, name, email, picture } = claims;
    if (!email) {
      return res.redirect("/login?error=oauth_no_email");
    }
    const role = resolveRole(email);
    let [user] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    if (!user) {
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (existingByEmail) {
        [user] = await db.update(users).set({ googleId, role, profileImageUrl: existingByEmail.profileImageUrl || picture || null }).where(eq(users.id, existingByEmail.id)).returning();
      } else {
        [user] = await db.insert(users).values({
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          googleId,
          role,
          profileImageUrl: picture || null
        }).returning();
      }
    } else {
      if (user.role !== role) {
        [user] = await db.update(users).set({ role }).where(eq(users.id, user.id)).returning();
      }
    }
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    res.redirect("/");
  } catch (err) {
    console.error("Google OAuth callback error:", err.message);
    res.redirect("/login?error=oauth_failed");
  }
});
router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      profileImageUrl: users.profileImageUrl,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, req.user.userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("Get me error:", err.message);
    res.status(500).json({ error: "Failed to get user info" });
  }
});
var googleAuth_default = router;

// server/routes/profile.ts
import { Router as Router2 } from "express";
import { eq as eq2, and } from "drizzle-orm";

// server/middleware/upload.ts
import multer from "multer";
var storage = multer.memoryStorage();
function fileFilter(_req, file, cb) {
  const allowedImageTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp"
  ];
  const allowedPdfTypes = ["application/pdf"];
  const allAllowed = [...allowedImageTypes, ...allowedPdfTypes];
  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: images (png, jpg, webp) and PDF files.`));
  }
}
var upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    // 50MB max
    files: 2
    // At most thumbnail + PDF per request
  }
});
var productUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "pdf", maxCount: 1 }
]);
var profileImageMulter = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, and WebP images are allowed for profile pictures."));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
  // 5 MB
});
var profileImageUpload = profileImageMulter.single("avatar");
var seriesImageMulter = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, and WebP images are allowed for series images."));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
  // 5 MB
});
var seriesImageUpload = seriesImageMulter.single("image");
var galleryImageMulter = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PNG, JPG, and WebP images are allowed for gallery images."
        )
      );
    }
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }
  // 10 MB per file, 10 files max
});
var galleryImageUpload = galleryImageMulter.array("images", 10);

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "\u26A0\uFE0F  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. File downloads will not work."
  );
}
var supabase = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
);
var PRODUCT_BUCKET = "product_pdfs";
var THUMBNAIL_BUCKET = "product_thumbnails";
var PROFILE_BUCKET = "profile_images";
var SERIES_BUCKET = "series_images";
var GALLERY_BUCKET = "product_gallery";
async function ensureBuckets() {
  const buckets = [
    { name: PRODUCT_BUCKET, public: false },
    { name: THUMBNAIL_BUCKET, public: true },
    { name: PROFILE_BUCKET, public: true },
    { name: SERIES_BUCKET, public: true },
    { name: GALLERY_BUCKET, public: true }
  ];
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket.name);
    if (error && error.message.includes("not found")) {
      const { error: createError } = await supabase.storage.createBucket(
        bucket.name,
        { public: bucket.public }
      );
      if (createError) {
        console.error(`\u274C Failed to create bucket "${bucket.name}":`, createError.message);
      } else {
        console.log(`\u2705 Created storage bucket: ${bucket.name} (public: ${bucket.public})`);
      }
    } else if (data) {
      console.log(`\u2705 Bucket exists: ${bucket.name}`);
    }
  }
}

// server/routes/profile.ts
var router2 = Router2();
router2.use(requireAuth);
var safeUserFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  firstName: users.firstName,
  middleName: users.middleName,
  lastName: users.lastName,
  displayName: users.displayName,
  dateOfBirth: users.dateOfBirth,
  gender: users.gender,
  phoneNumber: users.phoneNumber,
  alternatePhoneNumber: users.alternatePhoneNumber,
  profileImageUrl: users.profileImageUrl,
  // For future: isEmailVerified, isPhoneVerified, twoFactorEnabled, etc.
  googleId: users.googleId,
  // expose presence (not value) so frontend knows auth provider
  createdAt: users.createdAt,
  updatedAt: users.updatedAt
};
router2.get("/", async (req, res) => {
  try {
    const [user] = await db.select(safeUserFields).from(users).where(eq2(users.id, req.user.userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    const userAddresses = await db.select().from(addresses).where(eq2(addresses.userId, req.user.userId)).orderBy(addresses.createdAt);
    res.json({
      user: {
        ...user,
        // Expose provider without leaking the actual googleId value
        authProvider: user.googleId ? "google" : "email",
        googleId: void 0
      },
      addresses: userAddresses
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});
router2.patch("/", async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors
      });
    }
    const [updated] = await db.update(users).set(parsed.data).where(eq2(users.id, req.user.userId)).returning(safeUserFields);
    res.json({
      user: {
        ...updated,
        authProvider: updated.googleId ? "google" : "email",
        googleId: void 0
      }
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
router2.post(
  "/avatar",
  profileImageUpload,
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "Image must be under 5 MB" });
      }
      const ext = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${req.user.userId}/avatar-${Date.now()}.${ext}`;
      const [currentUser] = await db.select({ profileImageUrl: users.profileImageUrl }).from(users).where(eq2(users.id, req.user.userId)).limit(1);
      if (currentUser?.profileImageUrl) {
        try {
          const urlParts = currentUser.profileImageUrl.split(`/${PROFILE_BUCKET}/`);
          if (urlParts[1]) {
            await supabase.storage.from(PROFILE_BUCKET).remove([urlParts[1]]);
          }
        } catch {
        }
      }
      const { error: uploadError } = await supabase.storage.from(PROFILE_BUCKET).upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });
      if (uploadError) {
        console.error("Avatar upload error:", uploadError.message);
        return res.status(500).json({ error: "Failed to upload image" });
      }
      const {
        data: { publicUrl }
      } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(fileName);
      const [updated] = await db.update(users).set({ profileImageUrl: publicUrl }).where(eq2(users.id, req.user.userId)).returning(safeUserFields);
      res.json({ profileImageUrl: publicUrl, user: updated });
    } catch (err) {
      console.error("Avatar upload error:", err.message);
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  }
);
router2.get("/addresses", async (req, res) => {
  try {
    const userAddresses = await db.select().from(addresses).where(eq2(addresses.userId, req.user.userId)).orderBy(addresses.createdAt);
    res.json({ addresses: userAddresses });
  } catch (err) {
    console.error("Get addresses error:", err.message);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});
router2.post("/addresses", async (req, res) => {
  try {
    const parsed = insertAddressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors
      });
    }
    const existing = await db.select({ id: addresses.id }).from(addresses).where(eq2(addresses.userId, req.user.userId)).limit(1);
    const isFirst = existing.length === 0;
    if (parsed.data.isDefaultShipping || isFirst) {
      await db.update(addresses).set({ isDefaultShipping: false }).where(eq2(addresses.userId, req.user.userId));
    }
    if (parsed.data.isDefaultBilling || isFirst) {
      await db.update(addresses).set({ isDefaultBilling: false }).where(eq2(addresses.userId, req.user.userId));
    }
    const [newAddress] = await db.insert(addresses).values({
      ...parsed.data,
      userId: req.user.userId,
      isDefaultShipping: parsed.data.isDefaultShipping || isFirst,
      isDefaultBilling: parsed.data.isDefaultBilling || isFirst
    }).returning();
    res.status(201).json({ address: newAddress });
  } catch (err) {
    console.error("Create address error:", err.message);
    res.status(500).json({ error: "Failed to create address" });
  }
});
router2.put("/addresses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(addresses).where(and(eq2(addresses.id, id), eq2(addresses.userId, req.user.userId))).limit(1);
    if (!existing) return res.status(404).json({ error: "Address not found" });
    const parsed = updateAddressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors
      });
    }
    if (parsed.data.isDefaultShipping) {
      await db.update(addresses).set({ isDefaultShipping: false }).where(eq2(addresses.userId, req.user.userId));
    }
    if (parsed.data.isDefaultBilling) {
      await db.update(addresses).set({ isDefaultBilling: false }).where(eq2(addresses.userId, req.user.userId));
    }
    const [updated] = await db.update(addresses).set(parsed.data).where(and(eq2(addresses.id, id), eq2(addresses.userId, req.user.userId))).returning();
    res.json({ address: updated });
  } catch (err) {
    console.error("Update address error:", err.message);
    res.status(500).json({ error: "Failed to update address" });
  }
});
router2.delete("/addresses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(addresses).where(and(eq2(addresses.id, id), eq2(addresses.userId, req.user.userId))).limit(1);
    if (!existing) return res.status(404).json({ error: "Address not found" });
    await db.delete(addresses).where(and(eq2(addresses.id, id), eq2(addresses.userId, req.user.userId)));
    if (existing.isDefaultShipping || existing.isDefaultBilling) {
      const [next] = await db.select().from(addresses).where(eq2(addresses.userId, req.user.userId)).limit(1);
      if (next) {
        await db.update(addresses).set({
          isDefaultShipping: existing.isDefaultShipping || next.isDefaultShipping,
          isDefaultBilling: existing.isDefaultBilling || next.isDefaultBilling
        }).where(eq2(addresses.id, next.id));
      }
    }
    res.json({ message: "Address deleted" });
  } catch (err) {
    console.error("Delete address error:", err.message);
    res.status(500).json({ error: "Failed to delete address" });
  }
});
router2.patch("/addresses/:id/default", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    if (!["shipping", "billing"].includes(type)) {
      return res.status(400).json({ error: "type must be 'shipping' or 'billing'" });
    }
    const [existing] = await db.select({ id: addresses.id }).from(addresses).where(and(eq2(addresses.id, id), eq2(addresses.userId, req.user.userId))).limit(1);
    if (!existing) return res.status(404).json({ error: "Address not found" });
    const field = type === "shipping" ? "isDefaultShipping" : "isDefaultBilling";
    const dbField = type === "shipping" ? { isDefaultShipping: false } : { isDefaultBilling: false };
    const setField = type === "shipping" ? { isDefaultShipping: true } : { isDefaultBilling: true };
    await db.update(addresses).set(dbField).where(eq2(addresses.userId, req.user.userId));
    const [updated] = await db.update(addresses).set(setField).where(and(eq2(addresses.id, id), eq2(addresses.userId, req.user.userId))).returning();
    res.json({ address: updated });
  } catch (err) {
    console.error("Set default address error:", err.message);
    res.status(500).json({ error: "Failed to set default address" });
  }
});
var profile_default = router2;

// server/routes/products.ts
import { Router as Router3 } from "express";
import { eq as eq3, and as and2, ilike, or, desc, asc, sql, ne } from "drizzle-orm";
var router3 = Router3();
router3.get("/", async (req, res) => {
  try {
    const {
      search,
      series,
      sort = "popularity",
      featured,
      page = "1",
      limit = "16"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 16));
    const offset = (pageNum - 1) * limitNum;
    const conditions = [eq3(products.active, true)];
    if (search) {
      conditions.push(
        or(
          ilike(products.title, `%${search}%`),
          ilike(products.characterName, `%${search}%`),
          ilike(products.animeSeries, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      );
    }
    if (series) {
      conditions.push(eq3(products.animeSeries, series));
    }
    if (featured === "true") {
      conditions.push(eq3(products.featured, true));
    }
    let orderBy;
    switch (sort) {
      case "newest":
        orderBy = desc(products.createdAt);
        break;
      case "price-low":
        orderBy = asc(products.price);
        break;
      case "price-high":
        orderBy = desc(products.price);
        break;
      case "popularity":
      default:
        orderBy = desc(products.popularity);
        break;
    }
    const results = await db.select().from(products).where(and2(...conditions)).orderBy(orderBy).limit(limitNum).offset(offset);
    const [{ count }] = await db.select({ count: sql`count(*)::int` }).from(products).where(and2(...conditions));
    const totalProducts = count;
    const totalPages = Math.ceil(totalProducts / limitNum);
    const seriesList = await db.selectDistinct({ animeSeries: products.animeSeries }).from(products).where(eq3(products.active, true)).orderBy(asc(products.animeSeries));
    res.json({
      products: results,
      page: pageNum,
      limit: limitNum,
      totalProducts,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
      series: seriesList.map((s) => s.animeSeries)
    });
  } catch (err) {
    console.error("Get products error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
router3.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const [product] = await db.select().from(products).where(
      and2(
        eq3(products.active, true),
        isUuid ? or(eq3(products.id, id), eq3(products.slug, id)) : eq3(products.slug, id)
      )
    ).limit(1);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const images = await db.select().from(productImages).where(eq3(productImages.productId, product.id)).orderBy(asc(productImages.displayOrder));
    res.json({ product, productImages: images });
  } catch (err) {
    console.error("Get product error:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});
router3.get("/:id/recommended", async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const [product] = await db.select().from(products).where(
      and2(
        eq3(products.active, true),
        isUuid ? or(eq3(products.id, id), eq3(products.slug, id)) : eq3(products.slug, id)
      )
    ).limit(1);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    let recommended = await db.select().from(products).where(
      and2(
        eq3(products.active, true),
        eq3(products.animeSeries, product.animeSeries),
        ne(products.id, product.id)
      )
    ).orderBy(desc(products.popularity)).limit(8);
    if (recommended.length < 4) {
      const more = await db.select().from(products).where(
        and2(
          eq3(products.active, true),
          ne(products.id, product.id),
          ne(products.animeSeries, product.animeSeries)
        )
      ).orderBy(desc(products.popularity)).limit(8 - recommended.length);
      recommended = [...recommended, ...more];
    }
    res.json({ recommended });
  } catch (err) {
    console.error("Get recommended products error:", err.message);
    res.status(500).json({ error: "Failed to fetch recommended products" });
  }
});
var products_default = router3;

// server/routes/admin.ts
import { Router as Router4 } from "express";
import { eq as eq4, desc as desc2, sql as sql2, and as and3 } from "drizzle-orm";
import { randomUUID } from "crypto";
var router4 = Router4();
router4.get("/dashboard", requireAdmin, async (_req, res) => {
  try {
    const [productCount] = await db.select({ count: sql2`count(*)::int` }).from(products);
    const [customerCount] = await db.select({ count: sql2`count(*)::int` }).from(users).where(eq4(users.role, "customer"));
    const [orderCount] = await db.select({ count: sql2`count(*)::int` }).from(orders);
    const [revenueResult] = await db.select({
      total: sql2`coalesce(sum(total_amount), 0)`
    }).from(orders).where(eq4(orders.paymentStatus, "completed"));
    const recentProducts = await db.select().from(products).orderBy(desc2(products.createdAt)).limit(5);
    res.json({
      stats: {
        totalProducts: productCount.count,
        totalCustomers: customerCount.count,
        totalOrders: orderCount.count,
        revenue: parseFloat(revenueResult.total) || 0
      },
      recentProducts
    });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});
router4.get("/products", requireAdmin, async (_req, res) => {
  try {
    const allProducts = await db.select().from(products).orderBy(desc2(products.createdAt));
    res.json({ products: allProducts });
  } catch (err) {
    console.error("Admin list products error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
router4.post(
  "/products",
  requireAdmin,
  productUpload,
  async (req, res) => {
    try {
      const files = req.files;
      const body = {
        ...req.body,
        price: req.body.price,
        pageCount: parseInt(req.body.pageCount) || 1,
        popularity: parseInt(req.body.popularity) || 0,
        featured: req.body.featured === "true" || req.body.featured === true,
        active: req.body.active === "true" || req.body.active === true
      };
      const TITLE_SUFFIX = " \u2013 PRINTABLE PAPER 3D FIGURE";
      if (body.title && typeof body.title === "string" && !body.title.endsWith(TITLE_SUFFIX)) {
        body.title = `${body.title}${TITLE_SUFFIX}`;
      }
      if (!body.description && body.characterName && body.animeSeries) {
        body.description = `Unleash the spirit of ${body.characterName.trim()} with this DIY papercraft! Designed with their signature look from ${body.animeSeries.trim()}, this 3D figure captures their unique energy. Just download the PDF, print it on A4 paper, cut, fold, and glue to bring ${body.characterName.trim()} to life. Perfect for display, collecting, or gifting to any ${body.animeSeries.trim()} fan!`;
      }
      if (body.title && !body.slug) {
        const titleForSlug = body.title.replace(TITLE_SUFFIX, "");
        body.slug = titleForSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      const parsed = insertProductSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors
        });
      }
      let thumbnailUrl = null;
      let pdfUrl = null;
      if (files?.thumbnail?.[0]) {
        const file = files.thumbnail[0];
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(THUMBNAIL_BUCKET).upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
        if (error) {
          console.error("Thumbnail upload error:", error.message);
          return res.status(500).json({ error: "Failed to upload thumbnail" });
        }
        const {
          data: { publicUrl }
        } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(fileName);
        thumbnailUrl = publicUrl;
      }
      if (files?.pdf?.[0]) {
        const file = files.pdf[0];
        const ext = file.originalname.split(".").pop();
        const fileName = `${parsed.data.slug || randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
        if (error) {
          console.error("PDF upload error:", error.message);
          return res.status(500).json({ error: "Failed to upload PDF" });
        }
        pdfUrl = fileName;
      }
      const [newProduct] = await db.insert(products).values({
        ...parsed.data,
        thumbnailUrl,
        pdfUrl
      }).returning();
      res.status(201).json({ product: newProduct });
    } catch (err) {
      console.error("Create product error:", err.message);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);
router4.put(
  "/products/:id",
  requireAdmin,
  productUpload,
  async (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files;
      const [existing] = await db.select().from(products).where(eq4(products.id, id)).limit(1);
      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }
      const body = { ...req.body };
      if (body.pageCount) body.pageCount = parseInt(body.pageCount);
      if (body.popularity) body.popularity = parseInt(body.popularity);
      if (body.featured !== void 0)
        body.featured = body.featured === "true" || body.featured === true;
      if (body.active !== void 0)
        body.active = body.active === "true" || body.active === true;
      const TITLE_SUFFIX = " \u2013 PRINTABLE PAPER 3D FIGURE";
      if (body.title && typeof body.title === "string" && !body.title.endsWith(TITLE_SUFFIX)) {
        body.title = `${body.title}${TITLE_SUFFIX}`;
      }
      if (body.description !== void 0 && !body.description && body.characterName && body.animeSeries) {
        body.description = `Unleash the spirit of ${body.characterName.trim()} with this DIY papercraft! Designed with their signature look from ${body.animeSeries.trim()}, this 3D figure captures their unique energy. Just download the PDF, print it on A4 paper, cut, fold, and glue to bring ${body.characterName.trim()} to life. Perfect for display, collecting, or gifting to any ${body.animeSeries.trim()} fan!`;
      }
      if (body.title && !body.slug) {
        const titleForSlug = body.title.replace(TITLE_SUFFIX, "");
        body.slug = titleForSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      const parsed = updateProductSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors
        });
      }
      const updateData = { ...parsed.data };
      if (files?.thumbnail?.[0]) {
        const file = files.thumbnail[0];
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID()}.${ext}`;
        if (existing.thumbnailUrl) {
          try {
            const oldFileName = existing.thumbnailUrl.split("/").pop();
            if (oldFileName) {
              await supabase.storage.from(THUMBNAIL_BUCKET).remove([oldFileName]);
            }
          } catch {
          }
        }
        const { error } = await supabase.storage.from(THUMBNAIL_BUCKET).upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
        if (error) {
          return res.status(500).json({ error: "Failed to upload thumbnail" });
        }
        const {
          data: { publicUrl }
        } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(fileName);
        updateData.thumbnailUrl = publicUrl;
      }
      if (files?.pdf?.[0]) {
        const file = files.pdf[0];
        const ext = file.originalname.split(".").pop();
        const fileName = `${updateData.slug || existing.slug || randomUUID()}.${ext}`;
        if (existing.pdfUrl) {
          try {
            await supabase.storage.from(PRODUCT_BUCKET).remove([existing.pdfUrl]);
          } catch {
          }
        }
        const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
        if (error) {
          return res.status(500).json({ error: "Failed to upload PDF" });
        }
        updateData.pdfUrl = fileName;
      }
      const [updated] = await db.update(products).set(updateData).where(eq4(products.id, id)).returning();
      res.json({ product: updated });
    } catch (err) {
      console.error("Update product error:", err.message);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);
router4.delete(
  "/products/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const [existing] = await db.select().from(products).where(eq4(products.id, id)).limit(1);
      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (existing.thumbnailUrl) {
        try {
          const fileName = existing.thumbnailUrl.split("/").pop();
          if (fileName) {
            await supabase.storage.from(THUMBNAIL_BUCKET).remove([fileName]);
          }
        } catch {
        }
      }
      if (existing.pdfUrl) {
        try {
          await supabase.storage.from(PRODUCT_BUCKET).remove([existing.pdfUrl]);
        } catch {
        }
      }
      const gallery = await db.select().from(productImages).where(eq4(productImages.productId, id));
      if (gallery.length > 0) {
        const fileNames = gallery.map((img) => img.imageUrl.split("/").pop()).filter((name) => !!name);
        if (fileNames.length > 0) {
          try {
            await supabase.storage.from(GALLERY_BUCKET).remove(fileNames);
          } catch {
          }
        }
      }
      await db.delete(products).where(eq4(products.id, id));
      res.json({ message: "Product deleted successfully" });
    } catch (err) {
      console.error("Delete product error:", err.message);
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
);
router4.post(
  "/products/:id/images",
  requireAdmin,
  galleryImageUpload,
  async (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }
      const [existing] = await db.select().from(products).where(eq4(products.id, id)).limit(1);
      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }
      const currentImages = await db.select({ displayOrder: productImages.displayOrder }).from(productImages).where(eq4(productImages.productId, id));
      let nextOrder = currentImages.length > 0 ? Math.max(...currentImages.map((i) => i.displayOrder)) + 1 : 0;
      const insertedImages = [];
      for (const file of files) {
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
        if (error) {
          console.error("Gallery upload error:", error.message);
          continue;
        }
        const {
          data: { publicUrl }
        } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(fileName);
        const [newImage] = await db.insert(productImages).values({
          productId: id,
          imageUrl: publicUrl,
          displayOrder: nextOrder++
        }).returning();
        insertedImages.push(newImage);
      }
      res.status(201).json({ images: insertedImages });
    } catch (err) {
      console.error("Upload gallery images error:", err.message);
      res.status(500).json({ error: "Failed to upload images" });
    }
  }
);
router4.delete(
  "/products/:id/images/:imageId",
  requireAdmin,
  async (req, res) => {
    try {
      const { id, imageId } = req.params;
      const [existing] = await db.select().from(productImages).where(
        and3(
          eq4(productImages.id, imageId),
          eq4(productImages.productId, id)
        )
      ).limit(1);
      if (!existing) {
        return res.status(404).json({ error: "Image not found" });
      }
      try {
        const fileName = existing.imageUrl.split("/").pop();
        if (fileName) {
          await supabase.storage.from(GALLERY_BUCKET).remove([fileName]);
        }
      } catch {
      }
      await db.delete(productImages).where(eq4(productImages.id, imageId));
      res.json({ message: "Image deleted successfully" });
    } catch (err) {
      console.error("Delete gallery image error:", err.message);
      res.status(500).json({ error: "Failed to delete image" });
    }
  }
);
router4.put(
  "/products/:id/images/reorder",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { imageIds } = req.body;
      if (!Array.isArray(imageIds)) {
        return res.status(400).json({ error: "imageIds must be an array" });
      }
      const [product] = await db.select().from(products).where(eq4(products.id, id)).limit(1);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      await Promise.all(
        imageIds.map(
          (imageId, index2) => db.update(productImages).set({ displayOrder: index2 }).where(
            and3(
              eq4(productImages.id, imageId),
              eq4(productImages.productId, id)
            )
          )
        )
      );
      res.json({ message: "Images reordered successfully" });
    } catch (err) {
      console.error("Reorder gallery images error:", err.message);
      res.status(500).json({ error: "Failed to reorder images" });
    }
  }
);
var admin_default = router4;

// server/routes/downloads.ts
import { Router as Router5 } from "express";
import { eq as eq5, and as and4 } from "drizzle-orm";
var router5 = Router5();
router5.get("/:productId", requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;
    const [downloadRecord] = await db.select().from(downloads).where(
      and4(eq5(downloads.userId, userId), eq5(downloads.productId, productId))
    ).limit(1);
    if (!downloadRecord) {
      return res.status(403).json({ error: "You do not have access to this product" });
    }
    const [product] = await db.select({ pdfUrl: products.pdfUrl, title: products.title }).from(products).where(eq5(products.id, productId)).limit(1);
    if (!product || !product.pdfUrl) {
      return res.status(404).json({ error: "Product PDF not found" });
    }
    const { data, error } = await supabase.storage.from(PRODUCT_BUCKET).createSignedUrl(product.pdfUrl, 3600);
    if (error) {
      console.error("Supabase signed URL error:", error.message);
      return res.status(500).json({ error: "Failed to generate download link" });
    }
    await db.update(downloads).set({
      downloadCount: downloadRecord.downloadCount + 1,
      lastDownloadedAt: /* @__PURE__ */ new Date()
    }).where(eq5(downloads.id, downloadRecord.id));
    res.json({ downloadUrl: data.signedUrl });
  } catch (err) {
    console.error("Download route error:", err.message);
    res.status(500).json({ error: "Failed to generate download link" });
  }
});
router5.get(
  "/user/list",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const userDownloads = await db.select({
        id: downloads.id,
        productId: downloads.productId,
        downloadCount: downloads.downloadCount,
        lastDownloadedAt: downloads.lastDownloadedAt,
        createdAt: downloads.createdAt,
        productTitle: products.title,
        productThumbnail: products.thumbnailUrl,
        productSeries: products.animeSeries
      }).from(downloads).innerJoin(products, eq5(downloads.productId, products.id)).where(eq5(downloads.userId, userId)).orderBy(downloads.createdAt);
      res.json({ downloads: userDownloads });
    } catch (err) {
      console.error("List downloads error:", err.message);
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  }
);
var downloads_default = router5;

// server/routes/wishlist.ts
import { Router as Router6 } from "express";
import { eq as eq6, and as and5 } from "drizzle-orm";
import { z as z2 } from "zod";
var router6 = Router6();
router6.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userWishlist = await db.select({
      wishlistId: wishlists.id,
      productId: wishlists.productId,
      createdAt: wishlists.createdAt,
      product: products
    }).from(wishlists).innerJoin(products, eq6(wishlists.productId, products.id)).where(eq6(wishlists.userId, userId));
    res.json(userWishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});
router6.post("/:productId", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const uuidSchema = z2.string().uuid();
    const result = uuidSchema.safeParse(productId);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    const existing = await db.select().from(wishlists).where(and5(eq6(wishlists.userId, userId), eq6(wishlists.productId, productId))).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Product already in wishlist" });
    }
    const productExists = await db.select().from(products).where(eq6(products.id, productId)).limit(1);
    if (productExists.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const [newWishlistEntry] = await db.insert(wishlists).values({
      userId,
      productId
    }).returning();
    res.status(201).json(newWishlistEntry);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});
router6.delete("/:productId", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const result = await db.delete(wishlists).where(and5(eq6(wishlists.userId, userId), eq6(wishlists.productId, productId))).returning();
    if (result.length === 0) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});
var wishlist_default = router6;

// server/routes/series.ts
import { Router as Router7 } from "express";
import { eq as eq7, asc as asc2 } from "drizzle-orm";
import { randomUUID as randomUUID2 } from "crypto";
var router7 = Router7();
router7.get("/", async (_req, res) => {
  try {
    const allSeries = await db.select().from(animeSeries).orderBy(asc2(animeSeries.displayOrder), asc2(animeSeries.name));
    res.json({ series: allSeries });
  } catch (err) {
    console.error("List series error:", err.message);
    res.status(500).json({ error: "Failed to fetch series" });
  }
});
router7.post(
  "/",
  requireAdmin,
  seriesImageUpload,
  async (req, res) => {
    try {
      const body = {
        ...req.body,
        displayOrder: parseInt(req.body.displayOrder) || 0
      };
      const parsed = insertAnimeSeriesSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors
        });
      }
      let imageUrl = null;
      if (req.file) {
        const file = req.file;
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID2()}.${ext}`;
        const { error } = await supabase.storage.from(SERIES_BUCKET).upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
        if (error) {
          console.error("Series image upload error:", error.message);
          return res.status(500).json({ error: "Failed to upload image" });
        }
        const {
          data: { publicUrl }
        } = supabase.storage.from(SERIES_BUCKET).getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
      const [newSeries] = await db.insert(animeSeries).values({
        ...parsed.data,
        imageUrl
      }).returning();
      res.status(201).json({ series: newSeries });
    } catch (err) {
      console.error("Create series error:", err.message);
      if (err.message?.includes("unique")) {
        return res.status(409).json({ error: "A series with this name already exists" });
      }
      res.status(500).json({ error: "Failed to create series" });
    }
  }
);
router7.put(
  "/:id",
  requireAdmin,
  seriesImageUpload,
  async (req, res) => {
    try {
      const { id } = req.params;
      const [existing] = await db.select().from(animeSeries).where(eq7(animeSeries.id, id)).limit(1);
      if (!existing) {
        return res.status(404).json({ error: "Series not found" });
      }
      const body = { ...req.body };
      if (body.displayOrder !== void 0) {
        body.displayOrder = parseInt(body.displayOrder);
      }
      const parsed = updateAnimeSeriesSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors
        });
      }
      const updateData = { ...parsed.data };
      if (req.file) {
        const file = req.file;
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID2()}.${ext}`;
        if (existing.imageUrl) {
          try {
            const oldFileName = existing.imageUrl.split("/").pop();
            if (oldFileName) {
              await supabase.storage.from(SERIES_BUCKET).remove([oldFileName]);
            }
          } catch {
          }
        }
        const { error } = await supabase.storage.from(SERIES_BUCKET).upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
        if (error) {
          return res.status(500).json({ error: "Failed to upload image" });
        }
        const {
          data: { publicUrl }
        } = supabase.storage.from(SERIES_BUCKET).getPublicUrl(fileName);
        updateData.imageUrl = publicUrl;
      }
      const [updated] = await db.update(animeSeries).set(updateData).where(eq7(animeSeries.id, id)).returning();
      res.json({ series: updated });
    } catch (err) {
      console.error("Update series error:", err.message);
      if (err.message?.includes("unique")) {
        return res.status(409).json({ error: "A series with this name already exists" });
      }
      res.status(500).json({ error: "Failed to update series" });
    }
  }
);
router7.delete(
  "/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const [existing] = await db.select().from(animeSeries).where(eq7(animeSeries.id, id)).limit(1);
      if (!existing) {
        return res.status(404).json({ error: "Series not found" });
      }
      if (existing.imageUrl) {
        try {
          const fileName = existing.imageUrl.split("/").pop();
          if (fileName) {
            await supabase.storage.from(SERIES_BUCKET).remove([fileName]);
          }
        } catch {
        }
      }
      await db.delete(animeSeries).where(eq7(animeSeries.id, id));
      res.json({ message: "Series deleted successfully" });
    } catch (err) {
      console.error("Delete series error:", err.message);
      res.status(500).json({ error: "Failed to delete series" });
    }
  }
);
var series_default = router7;

// server/routes/payment.ts
import { Router as Router8 } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { eq as eq8, and as and6 } from "drizzle-orm";
var router8 = Router8();
var razorpay;
function getRazorpay() {
  if (!razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      console.error("Razorpay env vars missing:", {
        hasKeyId: !!key_id,
        hasKeySecret: !!key_secret,
        keyIdPrefix: key_id?.substring(0, 10) || "MISSING"
      });
      throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set");
    }
    razorpay = new Razorpay({ key_id, key_secret });
  }
  return razorpay;
}
router8.post("/create-order", requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({ error: "Minimum order amount is \u20B91 (100 paise)" });
    }
    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });
    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    if (err.statusCode === 401) {
      return res.status(401).json({ error: "Razorpay authentication failed" });
    }
    return res.status(500).json({ error: err.error?.description || "Failed to create order" });
  }
});
router8.post("/verify", requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, totalAmount } = req.body;
    const userId = req.user.userId;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature"
      });
    }
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed \u2014 signature mismatch" });
    }
    if (items && Array.isArray(items) && items.length > 0) {
      const [newOrder] = await db.insert(orders).values({
        userId,
        totalAmount: String(totalAmount || 0),
        paymentStatus: "completed",
        paymentIntentId: razorpay_payment_id
      }).returning();
      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.id,
          price: String(item.price)
        });
        const [existing] = await db.select().from(downloads).where(
          and6(eq8(downloads.userId, userId), eq8(downloads.productId, item.id))
        ).limit(1);
        if (!existing) {
          await db.insert(downloads).values({
            userId,
            productId: item.id
          });
        }
      }
    }
    return res.json({
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    return res.status(500).json({ error: "Payment verification failed" });
  }
});
var payment_default = router8;

// server/routes.ts
async function registerRoutes(app2) {
  app2.use("/api/auth", googleAuth_default);
  app2.use("/api/profile", profile_default);
  app2.use("/api/products", products_default);
  app2.use("/api/admin", admin_default);
  app2.use("/api/download", downloads_default);
  app2.use("/api/wishlist", wishlist_default);
  app2.use("/api/series", series_default);
  app2.use("/api/admin/series", series_default);
  app2.use("/api/payment", payment_default);
  const httpServer = createServer(app2);
  return httpServer;
}

// api/entry.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
var initialized = false;
var init = async () => {
  if (initialized) return;
  initialized = true;
  await ensureBuckets();
  await registerRoutes(app);
  const distPath = path.resolve(process.cwd(), "dist/public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
};
var entry_default = async (req, res) => {
  try {
    await init();
    app(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end(`Internal Server Error: ${e.message}
Stack: ${e.stack}`);
  }
};
export {
  entry_default as default
};
