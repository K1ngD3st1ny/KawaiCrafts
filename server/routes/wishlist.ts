import { Router } from "express";
import { db } from "../db";
import { wishlists, products } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

import { requireAuth } from "../middleware/auth";

// Get user's wishlist
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Join with products table to get product details
    const userWishlist = await db
      .select({
        wishlistId: wishlists.id,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: products,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId));

    res.json(userWishlist);
  } catch (error: any) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// Add to wishlist
router.post("/:productId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    // Validate productId is a UUID
    const uuidSchema = z.string().uuid();
    const result = uuidSchema.safeParse(productId);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Check if it's already in the wishlist
    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: "Product already in wishlist" });
    }

    // Check if product exists
    const productExists = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productExists.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [newWishlistEntry] = await db
      .insert(wishlists)
      .values({
        userId,
        productId,
      })
      .returning();

    res.status(201).json(newWishlistEntry);
  } catch (error: any) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

// Remove from wishlist
router.delete("/:productId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    const result = await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }

    res.json({ success: true, message: "Removed from wishlist" });
  } catch (error: any) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

export default router;
