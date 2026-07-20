import { Router, Request, Response } from "express";
import { db } from "../db";
import { products, productImages } from "@shared/schema";
import { eq, and, ilike, or, desc, asc, sql, ne } from "drizzle-orm";

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

    // Check if the id is a valid UUID
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    // Try by ID first, then by slug
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.active, true),
          isUuid ? or(eq(products.id, id), eq(products.slug, id)) : eq(products.slug, id)
        )
      )
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.displayOrder));

    res.json({ product, productImages: images });
  } catch (err: any) {
    console.error("Get product error:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// GET /api/products/:id/recommended — get recommended products
router.get("/:id/recommended", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if the id is a valid UUID
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    // Try by ID first, then by slug to find the current product
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.active, true),
          isUuid ? or(eq(products.id, id), eq(products.slug, id)) : eq(products.slug, id)
        )
      )
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Find recommended: same series first, exclude current
    let recommended = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.active, true),
          eq(products.animeSeries, product.animeSeries),
          ne(products.id, product.id)
        )
      )
      .orderBy(desc(products.popularity))
      .limit(8);

    // If we don't have enough from the same series, pad with other popular products
    if (recommended.length < 4) {
      const more = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.active, true),
            ne(products.id, product.id),
            ne(products.animeSeries, product.animeSeries)
          )
        )
        .orderBy(desc(products.popularity))
        .limit(8 - recommended.length);
      recommended = [...recommended, ...more];
    }

    // Return at most 8 recommendations (could be 4-8 based on availability, up to 8 limit)
    res.json({ recommended });
  } catch (err: any) {
    console.error("Get recommended products error:", err.message);
    res.status(500).json({ error: "Failed to fetch recommended products" });
  }
});

export default router;
