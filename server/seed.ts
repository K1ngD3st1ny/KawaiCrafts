import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("🌱 Seeding database...");

  // Admin is now auto-created on first Google login via ADMIN_EMAIL env var.
  // This seed script only verifies the configuration.
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    console.log(`ℹ️  ADMIN_EMAIL is set to: ${adminEmail}`);
    console.log(`   This account will be assigned the admin role on first Google sign-in.`);

    // Check if admin already exists
    const [existing] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, adminEmail.toLowerCase()))
      .limit(1);

    if (existing) {
      console.log(`✅ Admin user exists (role: ${existing.role})`);
    } else {
      console.log(`⏳ Admin user will be created on first Google sign-in.`);
    }
  } else {
    console.warn("⚠️  ADMIN_EMAIL is not set — no admin account will be auto-created.");
  }

  console.log("✅ Seed complete!");
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
