import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. File downloads will not work."
  );
}

// Server-side Supabase client with service_role key
// This bypasses Row Level Security — only use on the backend
export const supabase = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
);

// The bucket name where your PDF files are stored
export const PRODUCT_BUCKET = "product_pdfs";
