/**
 * One-time migration: Add Google OAuth columns to the users table.
 * Run with: npx tsx scripts/migrate-google-auth.ts
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running Google Auth migration...");

  // Make password_hash nullable (Google users have no password)
  await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;
  console.log("✓ password_hash is now nullable");

  // Add google_id column (unique, nullable)
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`;
  console.log("✓ google_id column added");

  console.log("\nMigration complete! ✅");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
