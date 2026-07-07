import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import googleAuthRoutes from "./routes/googleAuth";
import profileRoutes from "./routes/profile";
import productRoutes from "./routes/products";
import adminRoutes from "./routes/admin";
import downloadRoutes from "./routes/downloads";
import wishlistRoutes from "./routes/wishlist";
import seriesRoutes from "./routes/series";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount API route modules
  app.use("/api/auth", authRoutes);
  app.use("/api/auth", googleAuthRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/download", downloadRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/series", seriesRoutes);
  app.use("/api/admin/series", seriesRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
