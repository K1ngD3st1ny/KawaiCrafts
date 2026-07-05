/**
 * Migration: Add profile fields to users table + create addresses table.
 * Run with: npx tsx scripts/migrate-profile.ts
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running Profile migration...\n");

  // ── Extend users table ───────────────────────────────────────────────────
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`;
  console.log("✓ users.first_name");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name TEXT`;
  console.log("✓ users.middle_name");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`;
  console.log("✓ users.last_name");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT`;
  console.log("✓ users.display_name");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TEXT`;
  console.log("✓ users.date_of_birth");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT`;
  console.log("✓ users.gender");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT`;
  console.log("✓ users.phone_number");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS alternate_phone_number TEXT`;
  console.log("✓ users.alternate_phone_number");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT`;
  console.log("✓ users.profile_image_url");

  // ── Create addresses table ───────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS addresses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      landmark TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'India',
      postal_code TEXT NOT NULL,
      address_type TEXT NOT NULL DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
      is_default_shipping BOOLEAN NOT NULL DEFAULT FALSE,
      is_default_billing BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log("✓ addresses table created");

  // ── Indexes ──────────────────────────────────────────────────────────────
  await sql`CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_addresses_default_shipping ON addresses(user_id, is_default_shipping)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_addresses_default_billing ON addresses(user_id, is_default_billing)`;
  console.log("✓ addresses indexes created");

  console.log("\nMigration complete! ✅");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
