import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import {
  users,
  addresses,
  updateProfileSchema,
  changePasswordSchema,
  insertAddressSchema,
  updateAddressSchema,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { profileImageUpload } from "../middleware/upload";
import { supabase, PROFILE_BUCKET } from "../supabase";
import { randomUUID } from "crypto";

const router = Router();

// All profile routes require authentication
router.use(requireAuth);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safe user fields to return (never expose passwordHash / googleId) */
const safeUserFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  firstName: users.firstName,
  middleName: users.middleName,
  lastName: users.lastName,
  displayName: users.displayName,
  dateOfBirth: users.dateOfBirth,
  gender: users.gender,
  phoneNumber: users.phoneNumber,
  alternatePhoneNumber: users.alternatePhoneNumber,
  profileImageUrl: users.profileImageUrl,
  // For future: isEmailVerified, isPhoneVerified, twoFactorEnabled, etc.
  googleId: users.googleId, // expose presence (not value) so frontend knows auth provider
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

// ─── GET /api/profile ─────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  try {
    const [user] = await db
      .select(safeUserFields)
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) return res.status(404).json({ error: "User not found" });

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, req.user!.userId))
      .orderBy(addresses.createdAt);

    res.json({
      user: {
        ...user,
        // Expose provider without leaking the actual googleId value
        authProvider: user.googleId ? "google" : "email",
        googleId: undefined,
      },
      addresses: userAddresses,
    });
  } catch (err: any) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ─── PATCH /api/profile ───────────────────────────────────────────────────────

router.patch("/", async (req: Request, res: Response) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const [updated] = await db
      .update(users)
      .set(parsed.data)
      .where(eq(users.id, req.user!.userId))
      .returning(safeUserFields);

    res.json({
      user: {
        ...updated,
        authProvider: updated.googleId ? "google" : "email",
        googleId: undefined,
      },
    });
  } catch (err: any) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─── POST /api/profile/avatar ─────────────────────────────────────────────────

router.post(
  "/avatar",
  profileImageUpload,
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Validate size again just in case
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "Image must be under 5 MB" });
      }

      const ext = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${req.user!.userId}/avatar-${Date.now()}.${ext}`;

      // Delete old avatar if exists
      const [currentUser] = await db
        .select({ profileImageUrl: users.profileImageUrl })
        .from(users)
        .where(eq(users.id, req.user!.userId))
        .limit(1);

      if (currentUser?.profileImageUrl) {
        try {
          // Extract file path from URL
          const urlParts = currentUser.profileImageUrl.split(`/${PROFILE_BUCKET}/`);
          if (urlParts[1]) {
            await supabase.storage.from(PROFILE_BUCKET).remove([urlParts[1]]);
          }
        } catch {
          // Non-critical, continue
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from(PROFILE_BUCKET)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError.message);
        return res.status(500).json({ error: "Failed to upload image" });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(fileName);

      // Save URL to database
      const [updated] = await db
        .update(users)
        .set({ profileImageUrl: publicUrl })
        .where(eq(users.id, req.user!.userId))
        .returning(safeUserFields);

      res.json({ profileImageUrl: publicUrl, user: updated });
    } catch (err: any) {
      console.error("Avatar upload error:", err.message);
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  }
);

// ─── PATCH /api/profile/password ──────────────────────────────────────────────

router.patch("/password", async (req: Request, res: Response) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const [user] = await db
      .select({ passwordHash: users.passwordHash, googleId: users.googleId })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) return res.status(404).json({ error: "User not found" });

    // Block Google-only users
    if (user.googleId && !user.passwordHash) {
      return res.status(400).json({
        error: "Your account uses Google Sign-In. Password change is not available.",
      });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: "No password set on this account" });
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, req.user!.userId));

    res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    console.error("Change password error:", err.message);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// ─── GET /api/profile/addresses ───────────────────────────────────────────────

router.get("/addresses", async (req: Request, res: Response) => {
  try {
    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, req.user!.userId))
      .orderBy(addresses.createdAt);

    res.json({ addresses: userAddresses });
  } catch (err: any) {
    console.error("Get addresses error:", err.message);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

// ─── POST /api/profile/addresses ──────────────────────────────────────────────

router.post("/addresses", async (req: Request, res: Response) => {
  try {
    const parsed = insertAddressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    // If this is the first address, auto-set as defaults
    const existing = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, req.user!.userId))
      .limit(1);

    const isFirst = existing.length === 0;

    // If setting as default shipping, clear other defaults
    if (parsed.data.isDefaultShipping || isFirst) {
      await db
        .update(addresses)
        .set({ isDefaultShipping: false })
        .where(eq(addresses.userId, req.user!.userId));
    }
    if (parsed.data.isDefaultBilling || isFirst) {
      await db
        .update(addresses)
        .set({ isDefaultBilling: false })
        .where(eq(addresses.userId, req.user!.userId));
    }

    const [newAddress] = await db
      .insert(addresses)
      .values({
        ...parsed.data,
        userId: req.user!.userId,
        isDefaultShipping: parsed.data.isDefaultShipping || isFirst,
        isDefaultBilling: parsed.data.isDefaultBilling || isFirst,
      })
      .returning();

    res.status(201).json({ address: newAddress });
  } catch (err: any) {
    console.error("Create address error:", err.message);
    res.status(500).json({ error: "Failed to create address" });
  }
});

// ─── PUT /api/profile/addresses/:id ──────────────────────────────────────────

router.put("/addresses/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, req.user!.userId)))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Address not found" });

    const parsed = updateAddressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    // Handle default flag uniqueness
    if (parsed.data.isDefaultShipping) {
      await db
        .update(addresses)
        .set({ isDefaultShipping: false })
        .where(eq(addresses.userId, req.user!.userId));
    }
    if (parsed.data.isDefaultBilling) {
      await db
        .update(addresses)
        .set({ isDefaultBilling: false })
        .where(eq(addresses.userId, req.user!.userId));
    }

    const [updated] = await db
      .update(addresses)
      .set(parsed.data)
      .where(and(eq(addresses.id, id), eq(addresses.userId, req.user!.userId)))
      .returning();

    res.json({ address: updated });
  } catch (err: any) {
    console.error("Update address error:", err.message);
    res.status(500).json({ error: "Failed to update address" });
  }
});

// ─── DELETE /api/profile/addresses/:id ───────────────────────────────────────

router.delete("/addresses/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, req.user!.userId)))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Address not found" });

    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, req.user!.userId)));

    // If deleted was a default, auto-promote the most recent remaining address
    if (existing.isDefaultShipping || existing.isDefaultBilling) {
      const [next] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, req.user!.userId))
        .limit(1);

      if (next) {
        await db
          .update(addresses)
          .set({
            isDefaultShipping: existing.isDefaultShipping || next.isDefaultShipping,
            isDefaultBilling: existing.isDefaultBilling || next.isDefaultBilling,
          })
          .where(eq(addresses.id, next.id));
      }
    }

    res.json({ message: "Address deleted" });
  } catch (err: any) {
    console.error("Delete address error:", err.message);
    res.status(500).json({ error: "Failed to delete address" });
  }
});

// ─── PATCH /api/profile/addresses/:id/default ────────────────────────────────

router.patch("/addresses/:id/default", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body as { type: "shipping" | "billing" };

    if (!["shipping", "billing"].includes(type)) {
      return res.status(400).json({ error: "type must be 'shipping' or 'billing'" });
    }

    const [existing] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, req.user!.userId)))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Address not found" });

    const field = type === "shipping" ? "isDefaultShipping" : "isDefaultBilling";
    const dbField = type === "shipping" ? { isDefaultShipping: false } : { isDefaultBilling: false };
    const setField = type === "shipping" ? { isDefaultShipping: true } : { isDefaultBilling: true };

    // Clear current default
    await db
      .update(addresses)
      .set(dbField)
      .where(eq(addresses.userId, req.user!.userId));

    // Set new default
    const [updated] = await db
      .update(addresses)
      .set(setField)
      .where(and(eq(addresses.id, id), eq(addresses.userId, req.user!.userId)))
      .returning();

    res.json({ address: updated });
  } catch (err: any) {
    console.error("Set default address error:", err.message);
    res.status(500).json({ error: "Failed to set default address" });
  }
});

export default router;
