import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase, PRODUCT_BUCKET } from "./supabase";

export async function registerRoutes(app: Express): Promise<Server> {
  // Download route — generates a signed URL for a purchased product PDF
  app.get("/api/download/:productId", async (req, res) => {
    const { productId } = req.params;

    // The PDF filename in your Supabase bucket
    // e.g. productId "gojo-infinity" → file "gojo-infinity.pdf"
    const fileName = `${productId}.pdf`;

    try {
      const { data, error } = await supabase.storage
        .from(PRODUCT_BUCKET)
        .createSignedUrl(fileName, 3600); // expires in 1 hour

      if (error) {
        console.error("Supabase signed URL error:", error.message);
        return res.status(404).json({ error: "File not found" });
      }

      res.json({ downloadUrl: data.signedUrl });
    } catch (err: any) {
      console.error("Download route error:", err.message);
      res.status(500).json({ error: "Failed to generate download link" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
