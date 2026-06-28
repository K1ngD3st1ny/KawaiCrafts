import { Router, Request, Response } from "express";
import { db } from "../db";
import { downloads, products } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { supabase, PRODUCT_BUCKET } from "../supabase";

const router = Router();

// GET /api/download/:productId — generate signed download URL
router.get("/:productId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.userId;

    // Check the user has a download record for this product
    const [downloadRecord] = await db
      .select()
      .from(downloads)
      .where(
        and(eq(downloads.userId, userId), eq(downloads.productId, productId))
      )
      .limit(1);

    if (!downloadRecord) {
      return res
        .status(403)
        .json({ error: "You do not have access to this product" });
    }

    // Get product to find the PDF filename
    const [product] = await db
      .select({ pdfUrl: products.pdfUrl, title: products.title })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product || !product.pdfUrl) {
      return res.status(404).json({ error: "Product PDF not found" });
    }

    // Generate signed URL (expires in 1 hour)
    const { data, error } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .createSignedUrl(product.pdfUrl, 3600);

    if (error) {
      console.error("Supabase signed URL error:", error.message);
      return res.status(500).json({ error: "Failed to generate download link" });
    }

    // Update download record
    await db
      .update(downloads)
      .set({
        downloadCount: downloadRecord.downloadCount + 1,
        lastDownloadedAt: new Date(),
      })
      .where(eq(downloads.id, downloadRecord.id));

    res.json({ downloadUrl: data.signedUrl });
  } catch (err: any) {
    console.error("Download route error:", err.message);
    res.status(500).json({ error: "Failed to generate download link" });
  }
});

// GET /api/download/user/list — get all downloads for current user
router.get(
  "/user/list",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      const userDownloads = await db
        .select({
          id: downloads.id,
          productId: downloads.productId,
          downloadCount: downloads.downloadCount,
          lastDownloadedAt: downloads.lastDownloadedAt,
          createdAt: downloads.createdAt,
          productTitle: products.title,
          productThumbnail: products.thumbnailUrl,
          productSeries: products.animeSeries,
        })
        .from(downloads)
        .innerJoin(products, eq(downloads.productId, products.id))
        .where(eq(downloads.userId, userId))
        .orderBy(downloads.createdAt);

      res.json({ downloads: userDownloads });
    } catch (err: any) {
      console.error("List downloads error:", err.message);
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  }
);

export default router;
