import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  products,
  productImages,
  users,
  orders,
  insertProductSchema,
  updateProductSchema,
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAdmin, generateToken } from "../middleware/auth";
import { productUpload, galleryImageUpload } from "../middleware/upload";
import { supabase, PRODUCT_BUCKET, THUMBNAIL_BUCKET, GALLERY_BUCKET } from "../supabase";
import { randomUUID } from "crypto";

const router = Router();


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

      const TITLE_SUFFIX = " – PRINTABLE PAPER 3D FIGURE";

      // Auto-append title suffix
      if (body.title && typeof body.title === "string" && !body.title.endsWith(TITLE_SUFFIX)) {
        body.title = `${body.title}${TITLE_SUFFIX}`;
      }

      // Auto-generate description if missing
      if (!body.description && body.characterName && body.animeSeries) {
        body.description = `Unleash the spirit of ${body.characterName.trim()} with this DIY papercraft! Designed with their signature look from ${body.animeSeries.trim()}, this 3D figure captures their unique energy. Just download the PDF, print it on A4 paper, cut, fold, and glue to bring ${body.characterName.trim()} to life. Perfect for display, collecting, or gifting to any ${body.animeSeries.trim()} fan!`;
      }

      // Generate slug from title (ignoring suffix for cleaner URLs)
      if (body.title && !body.slug) {
        const titleForSlug = body.title.replace(TITLE_SUFFIX, "");
        body.slug = titleForSlug
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

      const TITLE_SUFFIX = " – PRINTABLE PAPER 3D FIGURE";

      // Auto-append title suffix
      if (body.title && typeof body.title === "string" && !body.title.endsWith(TITLE_SUFFIX)) {
        body.title = `${body.title}${TITLE_SUFFIX}`;
      }

      // Auto-generate description if missing
      if (body.description !== undefined && !body.description && body.characterName && body.animeSeries) {
        body.description = `Unleash the spirit of ${body.characterName.trim()} with this DIY papercraft! Designed with their signature look from ${body.animeSeries.trim()}, this 3D figure captures their unique energy. Just download the PDF, print it on A4 paper, cut, fold, and glue to bring ${body.characterName.trim()} to life. Perfect for display, collecting, or gifting to any ${body.animeSeries.trim()} fan!`;
      }

      // Auto-generate slug from title if title changed (ignoring suffix for cleaner URLs)
      if (body.title && !body.slug) {
        const titleForSlug = body.title.replace(TITLE_SUFFIX, "");
        body.slug = titleForSlug
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

      // Get all associated gallery images
      const gallery = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id));

      if (gallery.length > 0) {
        const fileNames = gallery
          .map((img) => img.imageUrl.split("/").pop())
          .filter((name): name is string => !!name);

        if (fileNames.length > 0) {
          try {
            await supabase.storage.from(GALLERY_BUCKET).remove(fileNames);
          } catch {
            // Non-critical
          }
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

// ─── Gallery Images ──────────────────────────────────────────────────────────

router.post(
  "/products/:id/images",
  requireAdmin,
  galleryImageUpload,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      // Check product exists
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Get current max display order
      const currentImages = await db
        .select({ displayOrder: productImages.displayOrder })
        .from(productImages)
        .where(eq(productImages.productId, id));

      let nextOrder = currentImages.length > 0
        ? Math.max(...currentImages.map((i) => i.displayOrder)) + 1
        : 0;

      const insertedImages = [];

      for (const file of files) {
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from(GALLERY_BUCKET)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          console.error("Gallery upload error:", error.message);
          continue; // Skip failed uploads
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(fileName);

        const [newImage] = await db
          .insert(productImages)
          .values({
            productId: id,
            imageUrl: publicUrl,
            displayOrder: nextOrder++,
          })
          .returning();

        insertedImages.push(newImage);
      }

      res.status(201).json({ images: insertedImages });
    } catch (err: any) {
      console.error("Upload gallery images error:", err.message);
      res.status(500).json({ error: "Failed to upload images" });
    }
  }
);

router.delete(
  "/products/:id/images/:imageId",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id, imageId } = req.params;

      const [existing] = await db
        .select()
        .from(productImages)
        .where(
          and(
            eq(productImages.id, imageId),
            eq(productImages.productId, id)
          )
        )
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Image not found" });
      }

      try {
        const fileName = existing.imageUrl.split("/").pop();
        if (fileName) {
          await supabase.storage.from(GALLERY_BUCKET).remove([fileName]);
        }
      } catch {
        // Non-critical
      }

      await db.delete(productImages).where(eq(productImages.id, imageId));

      res.json({ message: "Image deleted successfully" });
    } catch (err: any) {
      console.error("Delete gallery image error:", err.message);
      res.status(500).json({ error: "Failed to delete image" });
    }
  }
);

router.put(
  "/products/:id/images/reorder",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { imageIds } = req.body;

      if (!Array.isArray(imageIds)) {
        return res.status(400).json({ error: "imageIds must be an array" });
      }

      // Validate product
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Update in parallel (could be optimized with a single transaction or case statement)
      await Promise.all(
        imageIds.map((imageId, index) =>
          db
            .update(productImages)
            .set({ displayOrder: index })
            .where(
              and(
                eq(productImages.id, imageId),
                eq(productImages.productId, id)
              )
            )
        )
      );

      res.json({ message: "Images reordered successfully" });
    } catch (err: any) {
      console.error("Reorder gallery images error:", err.message);
      res.status(500).json({ error: "Failed to reorder images" });
    }
  }
);

export default router;
