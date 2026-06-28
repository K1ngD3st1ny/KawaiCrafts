import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("🌱 Seeding database...");

  // Create admin user
  const adminEmail = "admin@kawaicrafts.com";
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    await db.insert(users).values({
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
    });
    console.log(`✅ Admin created: ${adminEmail} / admin123`);
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  }

  console.log("✅ Seed complete!");
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
