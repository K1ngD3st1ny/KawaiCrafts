import "dotenv/config";
import { db } from "../server/db";
import { animeSeries, products } from "../shared/schema";
import { eq, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Creating anime_series table...");

  // Create the table if it doesn't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS anime_series (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      image_url TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  console.log("✅ anime_series table created.");

  // Seed with existing series from products
  const existingSeries = await db
    .selectDistinct({ name: products.animeSeries })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.animeSeries));

  console.log(`Found ${existingSeries.length} series from products.`);

  let seeded = 0;
  for (const s of existingSeries) {
    try {
      await db
        .insert(animeSeries)
        .values({ name: s.name, displayOrder: seeded })
        .onConflictDoNothing();
      seeded++;
    } catch (err: any) {
      // Skip duplicates
    }
  }

  console.log(`✅ Seeded ${seeded} series into anime_series table.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
