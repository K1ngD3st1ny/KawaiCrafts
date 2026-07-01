var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel.ts
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";

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
async function ensureBuckets() {
  const buckets = [
    { name: PRODUCT_BUCKET, public: false },
    { name: THUMBNAIL_BUCKET, public: true }
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

// server/routes.ts
import { createServer } from "http";

// server/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";

// server/db.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  downloads: () => downloads,
  insertDownloadSchema: () => insertDownloadSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertProductSchema: () => insertProductSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  orderItems: () => orderItems,
  orders: () => orders,
  products: () => products,
  registerSchema: () => registerSchema,
  updateProductSchema: () => updateProductSchema,
  users: () => users
});
import {
  pgTable,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  uuid,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["customer", "admin"] }).notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var insertUserSchema = createInsertSchema(users).pick({ name: true, email: true, passwordHash: true }).extend({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters")
});
var registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100)
});
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
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

// server/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Please configure your database connection."
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/routes/auth.ts
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

// server/routes/auth.ts
var router = Router();
router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors
      });
    }
    const { name, email, password } = parsed.data;
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [newUser] = await db.insert(users).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "customer"
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt
    });
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors
      });
    }
    const { email, password } = parsed.data;
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
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
    });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
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
var auth_default = router;

// server/routes/products.ts
import { Router as Router2 } from "express";
import { eq as eq2, and, ilike, or, desc, asc, sql } from "drizzle-orm";
var router2 = Router2();
router2.get("/", async (req, res) => {
  try {
    const {
      search,
      series,
      sort = "popularity",
      featured,
      limit = "50",
      offset = "0"
    } = req.query;
    const conditions = [eq2(products.active, true)];
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
      conditions.push(eq2(products.animeSeries, series));
    }
    if (featured === "true") {
      conditions.push(eq2(products.featured, true));
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
    const results = await db.select().from(products).where(and(...conditions)).orderBy(orderBy).limit(parseInt(limit)).offset(parseInt(offset));
    const [{ count }] = await db.select({ count: sql`count(*)::int` }).from(products).where(and(...conditions));
    const seriesList = await db.selectDistinct({ animeSeries: products.animeSeries }).from(products).where(eq2(products.active, true)).orderBy(asc(products.animeSeries));
    res.json({
      products: results,
      total: count,
      series: seriesList.map((s) => s.animeSeries)
    });
  } catch (err) {
    console.error("Get products error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [product] = await db.select().from(products).where(
      and(
        eq2(products.active, true),
        or(eq2(products.id, id), eq2(products.slug, id))
      )
    ).limit(1);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ product });
  } catch (err) {
    console.error("Get product error:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});
var products_default = router2;

// server/routes/admin.ts
import { Router as Router3 } from "express";
import { eq as eq3, desc as desc2, sql as sql2, and as and2 } from "drizzle-orm";
import bcrypt2 from "bcryptjs";

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

// server/routes/admin.ts
import { randomUUID } from "crypto";
var router3 = Router3();
router3.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors
      });
    }
    const { email, password } = parsed.data;
    const [user] = await db.select().from(users).where(and2(eq3(users.email, email.toLowerCase()), eq3(users.role, "admin"))).limit(1);
    if (!user) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }
    const valid = await bcrypt2.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: "admin"
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error("Admin login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});
router3.get("/dashboard", requireAdmin, async (_req, res) => {
  try {
    const [productCount] = await db.select({ count: sql2`count(*)::int` }).from(products);
    const [customerCount] = await db.select({ count: sql2`count(*)::int` }).from(users).where(eq3(users.role, "customer"));
    const [orderCount] = await db.select({ count: sql2`count(*)::int` }).from(orders);
    const [revenueResult] = await db.select({
      total: sql2`coalesce(sum(total_amount), 0)`
    }).from(orders).where(eq3(orders.paymentStatus, "completed"));
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
router3.get("/products", requireAdmin, async (_req, res) => {
  try {
    const allProducts = await db.select().from(products).orderBy(desc2(products.createdAt));
    res.json({ products: allProducts });
  } catch (err) {
    console.error("Admin list products error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
router3.post(
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
      if (body.title && !body.slug) {
        body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
router3.put(
  "/products/:id",
  requireAdmin,
  productUpload,
  async (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files;
      const [existing] = await db.select().from(products).where(eq3(products.id, id)).limit(1);
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
      if (body.title && !body.slug) {
        body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
      const [updated] = await db.update(products).set(updateData).where(eq3(products.id, id)).returning();
      res.json({ product: updated });
    } catch (err) {
      console.error("Update product error:", err.message);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);
router3.delete(
  "/products/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const [existing] = await db.select().from(products).where(eq3(products.id, id)).limit(1);
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
      await db.delete(products).where(eq3(products.id, id));
      res.json({ message: "Product deleted successfully" });
    } catch (err) {
      console.error("Delete product error:", err.message);
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
);
var admin_default = router3;

// server/routes/downloads.ts
import { Router as Router4 } from "express";
import { eq as eq4, and as and3 } from "drizzle-orm";
var router4 = Router4();
router4.get("/:productId", requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;
    const [downloadRecord] = await db.select().from(downloads).where(
      and3(eq4(downloads.userId, userId), eq4(downloads.productId, productId))
    ).limit(1);
    if (!downloadRecord) {
      return res.status(403).json({ error: "You do not have access to this product" });
    }
    const [product] = await db.select({ pdfUrl: products.pdfUrl, title: products.title }).from(products).where(eq4(products.id, productId)).limit(1);
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
    }).where(eq4(downloads.id, downloadRecord.id));
    res.json({ downloadUrl: data.signedUrl });
  } catch (err) {
    console.error("Download route error:", err.message);
    res.status(500).json({ error: "Failed to generate download link" });
  }
});
router4.get(
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
      }).from(downloads).innerJoin(products, eq4(downloads.productId, products.id)).where(eq4(downloads.userId, userId)).orderBy(downloads.createdAt);
      res.json({ downloads: userDownloads });
    } catch (err) {
      console.error("List downloads error:", err.message);
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  }
);
var downloads_default = router4;

// server/routes.ts
async function registerRoutes(app2) {
  app2.use("/api/auth", auth_default);
  app2.use("/api/products", products_default);
  app2.use("/api/admin", admin_default);
  app2.use("/api/download", downloads_default);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vercel.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
var initialized = false;
var initError = null;
var init = async () => {
  if (initialized) return;
  if (initError) throw initError;
  try {
    console.log("[init] Ensuring buckets...");
    await ensureBuckets();
    console.log("[init] Registering routes...");
    await registerRoutes(app);
    const distPath = path.resolve(process.cwd(), "dist/public");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
    initialized = true;
    console.log("[init] \u2705 Initialization complete");
  } catch (e) {
    initError = e;
    console.error("[init] \u274C Initialization failed:", e.message);
    console.error("[init] Stack:", e.stack);
    throw e;
  }
};
var vercel_default = async (req, res) => {
  try {
    await init();
    app(req, res);
  } catch (e) {
    console.error("[handler] Error:", e.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Function initialization failed",
      message: e.message,
      stack: process.env.NODE_ENV !== "production" ? e.stack : void 0
    }));
  }
};
export {
  vercel_default as default
};
