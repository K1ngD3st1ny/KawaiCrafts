import { Router, Request, Response } from "express";
import { Google, generateState, generateCodeVerifier, decodeIdToken } from "arctic";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "../middleware/auth";

const router = Router();

// ─── Arctic Google client ────────────────────────────────────────────────────

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment"
    );
  }

  return new Google(clientId, clientSecret, callbackUrl);
}

// ─── GET /api/auth/google ────────────────────────────────────────────────────
// Redirects the user to Google's consent screen.

router.get("/google", (_req: Request, res: Response) => {
  try {
    const google = getGoogleClient();

    // Generate state (CSRF protection) and code verifier (PKCE)
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    // Build the Google authorization URL (requires PKCE in Arctic v2+)
    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email",
    ]);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 5 * 60 * 1000, // 5 minutes
    };

    // Store both state and code_verifier in short-lived cookies — stateless, no sessions
    res.cookie("oauth_state", state, cookieOptions);
    res.cookie("oauth_code_verifier", codeVerifier, cookieOptions);

    res.redirect(url.toString());
  } catch (err: any) {
    console.error("Google OAuth init error:", err.message);
    res.redirect("/login?error=oauth_config");
  }
});

// ─── GET /api/auth/google/callback ──────────────────────────────────────────
// Google redirects here after the user grants/denies permission.

router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query as Record<string, string>;

    // Handle user denial
    if (error) {
      console.warn("Google OAuth denied:", error);
      return res.redirect("/login?error=oauth_denied");
    }

    // Validate state to prevent CSRF
    const storedState = req.cookies?.oauth_state;
    const storedCodeVerifier = req.cookies?.oauth_code_verifier;

    if (!state || !storedState || state !== storedState || !storedCodeVerifier) {
      console.warn("OAuth state or code verifier mismatch");
      return res.redirect("/login?error=oauth_state");
    }

    // Clear OAuth cookies immediately
    res.clearCookie("oauth_state");
    res.clearCookie("oauth_code_verifier");

    if (!code) {
      return res.redirect("/login?error=oauth_no_code");
    }

    // Exchange code + codeVerifier for tokens (PKCE)
    const google = getGoogleClient();
    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);

    // Decode the ID token to get user info (no extra network call needed)
    const claims = decodeIdToken(tokens.idToken()) as {
      sub: string;
      name: string;
      email: string;
      email_verified?: boolean;
      picture?: string;
    };

    const { sub: googleId, name, email } = claims;

    if (!email) {
      return res.redirect("/login?error=oauth_no_email");
    }

    // ── Find or create user ──────────────────────────────────────────────────

    // 1. Try to find user by Google ID (returning user who used Google before)
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);

    if (!user) {
      // 2. Try to find by email (existing email/password user — link their Google account)
      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existingByEmail) {
        // Link Google ID to existing account
        [user] = await db
          .update(users)
          .set({ googleId })
          .where(eq(users.id, existingByEmail.id))
          .returning();
      } else {
        // 3. Brand new user — create account (no password)
        [user] = await db
          .insert(users)
          .values({
            name: name || email.split("@")[0],
            email: email.toLowerCase(),
            googleId,
            passwordHash: null,
            role: "customer",
          })
          .returning();
      }
    }

    // ── Issue JWT cookie (same as email/password login) ──────────────────────
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as "customer" | "admin",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to home — useAuth will pick up the session via /api/auth/me
    res.redirect("/");
  } catch (err: any) {
    console.error("Google OAuth callback error:", err.message);
    res.redirect("/login?error=oauth_failed");
  }
});

export default router;
