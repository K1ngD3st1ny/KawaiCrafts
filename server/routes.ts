import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import adminRoutes from "./routes/admin";
import downloadRoutes from "./routes/downloads";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount API route modules
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/download", downloadRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
