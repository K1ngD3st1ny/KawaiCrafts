import { Router, type Request, type Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../db";
import { orders, orderItems, downloads } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ── Razorpay instance ────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ── POST /api/payment/create-order ───────────────────────────────────
router.post("/create-order", requireAuth, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const amountInPaise = Math.round(amount * 100);

    if (amountInPaise < 100) {
      return res
        .status(400)
        .json({ error: "Minimum order amount is ₹1 (100 paise)" });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: any) {
    console.error("Razorpay create-order error:", err);
    if (err.statusCode === 401) {
      return res.status(401).json({ error: "Razorpay authentication failed" });
    }
    return res
      .status(500)
      .json({ error: err.error?.description || "Failed to create order" });
  }
});

// ── POST /api/payment/verify ─────────────────────────────────────────
router.post("/verify", requireAuth, async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, totalAmount } = req.body;
    const userId = req.user!.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
      });
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ error: "Payment verification failed — signature mismatch" });
    }

    // Signature is valid — grant access to the products
    if (items && Array.isArray(items) && items.length > 0) {
      // 1. Create the Order record
      const [newOrder] = await db.insert(orders).values({
        userId,
        totalAmount: String(totalAmount || 0),
        paymentStatus: "completed",
        paymentIntentId: razorpay_payment_id,
      }).returning();

      // 2. Create Order Items & Download access
      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.id,
          price: String(item.price),
        });

        // Grant access in downloads table (if they don't already have it)
        const [existing] = await db
          .select()
          .from(downloads)
          .where(
            and(eq(downloads.userId, userId), eq(downloads.productId, item.id))
          )
          .limit(1);

        if (!existing) {
          await db.insert(downloads).values({
            userId,
            productId: item.id,
          });
        }
      }
    }

    return res.json({
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err: any) {
    console.error("Razorpay verify error:", err);
    return res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;
