import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { registerRoutes } from "../server/routes";
import { ensureBuckets } from "../server/supabase";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let initialized = false;

const init = async () => {
  if (initialized) return;
  initialized = true;

  await ensureBuckets();
  await registerRoutes(app);

  // Serve static files from the built client
  const distPath = path.resolve(process.cwd(), "dist/public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
};

export default async (req: any, res: any) => {
  try {
    await init();
    app(req, res);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end(`Internal Server Error: ${e.message}\nStack: ${e.stack}`);
  }
};
