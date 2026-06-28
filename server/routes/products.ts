import { Router, Request, Response } from "express";
import { db } from "../db";
import { products } from "@shared/schema";
import { eq, and, ilike, or, desc, asc, sql } from "drizzle-orm";

const router = Router();

// GET /api/products — list active products with search, filter, sort
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      search,
      series,
      sort = "popularity",
      featured,
      limit = "50",
      offset = "0",
    } = req.query as Record<string, string>;

    // Build conditions array
    const conditions = [eq(products.active, true)];

    if (search) {
      conditions.push(
        or(
          ilike(products.title, `%${search}%`),
          ilike(products.characterName, `%${search}%`),
          ilike(products.animeSeries, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )!
      );
    }

    if (series) {
      conditions.push(eq(products.animeSeries, series));
    }

    if (featured === "true") {
      conditions.push(eq(products.featured, true));
    }

    // Determine sort order
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

    const results = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Also get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(...conditions));

    // Get distinct series for filter options
    const seriesList = await db
      .selectDistinct({ animeSeries: products.animeSeries })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.animeSeries));

    res.json({
      products: results,
      total: count,
      series: seriesList.map((s) => s.animeSeries),
    });
  } catch (err: any) {
    console.error("Get products error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id — get single product by ID or slug
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try by ID first, then by slug
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.active, true),
          or(eq(products.id, id), eq(products.slug, id))
        )
      )
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product });
  } catch (err: any) {
    console.error("Get product error:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;
