import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  products,
  users,
  orders,
  insertProductSchema,
  updateProductSchema,
  loginSchema,
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAdmin, generateToken } from "../middleware/auth";
import { productUpload } from "../middleware/upload";
import { supabase, PRODUCT_BUCKET, THUMBNAIL_BUCKET } from "../supabase";
import { randomUUID } from "crypto";

const router = Router();

// ─── Admin Login ─────────────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), eq(users.role, "admin")))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: "admin",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err: any) {
    console.error("Admin login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
router.get("/dashboard", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [productCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);

    const [customerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, "customer"));

    const [orderCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);

    const [revenueResult] = await db
      .select({
        total: sql<string>`coalesce(sum(total_amount), 0)`,
      })
      .from(orders)
      .where(eq(orders.paymentStatus, "completed"));

    const recentProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(5);

    res.json({
      stats: {
        totalProducts: productCount.count,
        totalCustomers: customerCount.count,
        totalOrders: orderCount.count,
        revenue: parseFloat(revenueResult.total) || 0,
      },
      recentProducts,
    });
  } catch (err: any) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// ─── List All Products (Admin) ───────────────────────────────────────────────
router.get("/products", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    res.json({ products: allProducts });
  } catch (err: any) {
    console.error("Admin list products error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ─── Create Product ──────────────────────────────────────────────────────────
router.post(
  "/products",
  requireAdmin,
  productUpload,
  async (req: Request, res: Response) => {
    try {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      // Parse body fields
      const body = {
        ...req.body,
        price: req.body.price,
        pageCount: parseInt(req.body.pageCount) || 1,
        popularity: parseInt(req.body.popularity) || 0,
        featured: req.body.featured === "true" || req.body.featured === true,
        active: req.body.active === "true" || req.body.active === true,
      };

      // Generate slug from title
      if (body.title && !body.slug) {
        body.slug = body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      // Validate
      const parsed = insertProductSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      let thumbnailUrl: string | null = null;
      let pdfUrl: string | null = null;

      // Upload thumbnail to Supabase
      if (files?.thumbnail?.[0]) {
        const file = files.thumbnail[0];
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from(THUMBNAIL_BUCKET)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          console.error("Thumbnail upload error:", error.message);
          return res
            .status(500)
            .json({ error: "Failed to upload thumbnail" });
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(fileName);
        thumbnailUrl = publicUrl;
      }

      // Upload PDF to Supabase
      if (files?.pdf?.[0]) {
        const file = files.pdf[0];
        const ext = file.originalname.split(".").pop();
        const fileName = `${parsed.data.slug || randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from(PRODUCT_BUCKET)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          console.error("PDF upload error:", error.message);
          return res.status(500).json({ error: "Failed to upload PDF" });
        }

        // Store the filename (not a public URL — PDFs are accessed via signed URLs only)
        pdfUrl = fileName;
      }

      // Insert product
      const [newProduct] = await db
        .insert(products)
        .values({
          ...parsed.data,
          thumbnailUrl,
          pdfUrl,
        })
        .returning();

      res.status(201).json({ product: newProduct });
    } catch (err: any) {
      console.error("Create product error:", err.message);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);

// ─── Update Product ──────────────────────────────────────────────────────────
router.put(
  "/products/:id",
  requireAdmin,
  productUpload,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      // Check product exists
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Parse body
      const body: any = { ...req.body };
      if (body.pageCount) body.pageCount = parseInt(body.pageCount);
      if (body.popularity) body.popularity = parseInt(body.popularity);
      if (body.featured !== undefined)
        body.featured = body.featured === "true" || body.featured === true;
      if (body.active !== undefined)
        body.active = body.active === "true" || body.active === true;

      // Auto-generate slug from title if title changed
      if (body.title && !body.slug) {
        body.slug = body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      const parsed = updateProductSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const updateData: any = { ...parsed.data };

      // Replace thumbnail if new one uploaded
      if (files?.thumbnail?.[0]) {
        const file = files.thumbnail[0];
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID()}.${ext}`;

        // Delete old thumbnail if it exists
        if (existing.thumbnailUrl) {
          try {
            const oldFileName = existing.thumbnailUrl.split("/").pop();
            if (oldFileName) {
              await supabase.storage
                .from(THUMBNAIL_BUCKET)
                .remove([oldFileName]);
            }
          } catch {
            // Non-critical, continue
          }
        }

        const { error } = await supabase.storage
          .from(THUMBNAIL_BUCKET)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          return res
            .status(500)
            .json({ error: "Failed to upload thumbnail" });
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(fileName);
        updateData.thumbnailUrl = publicUrl;
      }

      // Replace PDF if new one uploaded
      if (files?.pdf?.[0]) {
        const file = files.pdf[0];
        const ext = file.originalname.split(".").pop();
        const fileName = `${updateData.slug || existing.slug || randomUUID()}.${ext}`;

        // Delete old PDF
        if (existing.pdfUrl) {
          try {
            await supabase.storage
              .from(PRODUCT_BUCKET)
              .remove([existing.pdfUrl]);
          } catch {
            // Non-critical
          }
        }

        const { error } = await supabase.storage
          .from(PRODUCT_BUCKET)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (error) {
          return res.status(500).json({ error: "Failed to upload PDF" });
        }

        updateData.pdfUrl = fileName;
      }

      // Update product
      const [updated] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();

      res.json({ product: updated });
    } catch (err: any) {
      console.error("Update product error:", err.message);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// ─── Delete Product ──────────────────────────────────────────────────────────
router.delete(
  "/products/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Delete storage files
      if (existing.thumbnailUrl) {
        try {
          const fileName = existing.thumbnailUrl.split("/").pop();
          if (fileName) {
            await supabase.storage.from(THUMBNAIL_BUCKET).remove([fileName]);
          }
        } catch {
          // Non-critical
        }
      }

      if (existing.pdfUrl) {
        try {
          await supabase.storage.from(PRODUCT_BUCKET).remove([existing.pdfUrl]);
        } catch {
          // Non-critical
        }
      }

      // Delete from database
      await db.delete(products).where(eq(products.id, id));

      res.json({ message: "Product deleted successfully" });
    } catch (err: any) {
      console.error("Delete product error:", err.message);
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
);

export default router;
