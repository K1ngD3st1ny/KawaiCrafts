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

// The bucket name where product thumbnail images are stored
export const THUMBNAIL_BUCKET = "product_thumbnails";

// Ensure required storage buckets exist (creates them if missing)
export async function ensureBuckets() {
  const buckets = [
    { name: PRODUCT_BUCKET, public: false },
    { name: THUMBNAIL_BUCKET, public: true },
  ];

  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket.name);
    if (error && error.message.includes("not found")) {
      const { error: createError } = await supabase.storage.createBucket(
        bucket.name,
        { public: bucket.public }
      );
      if (createError) {
        console.error(`❌ Failed to create bucket "${bucket.name}":`, createError.message);
      } else {
        console.log(`✅ Created storage bucket: ${bucket.name} (public: ${bucket.public})`);
      }
    } else if (data) {
      console.log(`✅ Bucket exists: ${bucket.name}`);
    }
  }
}
