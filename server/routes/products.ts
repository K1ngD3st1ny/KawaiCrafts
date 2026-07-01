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
      page = "1",
      limit = "16",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 16));
    const offset = (pageNum - 1) * limitNum;

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
      .limit(limitNum)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(...conditions));

    const totalProducts = count;
    const totalPages = Math.ceil(totalProducts / limitNum);

    // Get distinct series for filter options
    const seriesList = await db
      .selectDistinct({ animeSeries: products.animeSeries })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.animeSeries));

    res.json({
      products: results,
      page: pageNum,
      limit: limitNum,
      totalProducts,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
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
