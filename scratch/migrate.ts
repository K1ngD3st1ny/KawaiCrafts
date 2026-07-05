import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
    `);
    
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlists_user_product_unique ON wishlists(user_id, product_id);
    `);
    
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
