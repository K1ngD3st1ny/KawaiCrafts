import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  animeSeries,
  insertAnimeSeriesSchema,
  updateAnimeSeriesSchema,
} from "@shared/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";
import { seriesImageUpload } from "../middleware/upload";
import { supabase, SERIES_BUCKET } from "../supabase";
import { randomUUID } from "crypto";

const router = Router();

// ─── Public: List all series ─────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    const allSeries = await db
      .select()
      .from(animeSeries)
      .orderBy(asc(animeSeries.displayOrder), asc(animeSeries.name));

    res.json({ series: allSeries });
  } catch (err: any) {
    console.error("List series error:", err.message);
    res.status(500).json({ error: "Failed to fetch series" });
  }
});

// ─── Admin: Create series ────────────────────────────────────────────────────
router.post(
  "/",
  requireAdmin,
  seriesImageUpload,
  async (req: Request, res: Response) => {
    try {
      const body = {
        ...req.body,
        displayOrder: parseInt(req.body.displayOrder) || 0,
      };

      const parsed = insertAnimeSeriesSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      let imageUrl: string | null = null;

      // Upload image to Supabase if provided
      if (req.file) {
        const file = req.file;
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from(SERIES_BUCKET)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          console.error("Series image upload error:", error.message);
          return res.status(500).json({ error: "Failed to upload image" });
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(SERIES_BUCKET).getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const [newSeries] = await db
        .insert(animeSeries)
        .values({
          ...parsed.data,
          imageUrl,
        })
        .returning();

      res.status(201).json({ series: newSeries });
    } catch (err: any) {
      console.error("Create series error:", err.message);
      if (err.message?.includes("unique")) {
        return res.status(409).json({ error: "A series with this name already exists" });
      }
      res.status(500).json({ error: "Failed to create series" });
    }
  }
);

// ─── Admin: Update series ────────────────────────────────────────────────────
router.put(
  "/:id",
  requireAdmin,
  seriesImageUpload,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [existing] = await db
        .select()
        .from(animeSeries)
        .where(eq(animeSeries.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Series not found" });
      }

      const body: any = { ...req.body };
      if (body.displayOrder !== undefined) {
        body.displayOrder = parseInt(body.displayOrder);
      }

      const parsed = updateAnimeSeriesSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const updateData: any = { ...parsed.data };

      // Replace image if new one uploaded
      if (req.file) {
        const file = req.file;
        const ext = file.originalname.split(".").pop();
        const fileName = `${randomUUID()}.${ext}`;

        // Delete old image if it exists
        if (existing.imageUrl) {
          try {
            const oldFileName = existing.imageUrl.split("/").pop();
            if (oldFileName) {
              await supabase.storage.from(SERIES_BUCKET).remove([oldFileName]);
            }
          } catch {
            // Non-critical, continue
          }
        }

        const { error } = await supabase.storage
          .from(SERIES_BUCKET)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          return res.status(500).json({ error: "Failed to upload image" });
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(SERIES_BUCKET).getPublicUrl(fileName);
        updateData.imageUrl = publicUrl;
      }

      const [updated] = await db
        .update(animeSeries)
        .set(updateData)
        .where(eq(animeSeries.id, id))
        .returning();

      res.json({ series: updated });
    } catch (err: any) {
      console.error("Update series error:", err.message);
      if (err.message?.includes("unique")) {
        return res.status(409).json({ error: "A series with this name already exists" });
      }
      res.status(500).json({ error: "Failed to update series" });
    }
  }
);

// ─── Admin: Delete series ────────────────────────────────────────────────────
router.delete(
  "/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [existing] = await db
        .select()
        .from(animeSeries)
        .where(eq(animeSeries.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Series not found" });
      }

      // Delete image from storage
      if (existing.imageUrl) {
        try {
          const fileName = existing.imageUrl.split("/").pop();
          if (fileName) {
            await supabase.storage.from(SERIES_BUCKET).remove([fileName]);
          }
        } catch {
          // Non-critical
        }
      }

      await db.delete(animeSeries).where(eq(animeSeries.id, id));

      res.json({ message: "Series deleted successfully" });
    } catch (err: any) {
      console.error("Delete series error:", err.message);
      res.status(500).json({ error: "Failed to delete series" });
    }
  }
);

export default router;
