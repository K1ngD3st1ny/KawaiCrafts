import multer from "multer";

// Use memory storage — files are buffered in memory then uploaded to Supabase
const storage = multer.memoryStorage();

// File filter: allow images and PDFs only
function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const allowedImageTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];
  const allowedPdfTypes = ["application/pdf"];
  const allAllowed = [...allowedImageTypes, ...allowedPdfTypes];

  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: images (png, jpg, webp) and PDF files.`));
  }
}

// General upload middleware — 50MB max per file
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 2, // At most thumbnail + PDF per request
  },
});

// Specific upload configurations
export const productUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "pdf", maxCount: 1 },
]);

// Profile image upload — images only, 5 MB max
const profileImageMulter = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, and WebP images are allowed for profile pictures."));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
});

export const profileImageUpload = profileImageMulter.single("avatar");

// Series image upload — images only, 5 MB max
const seriesImageMulter = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, and WebP images are allowed for series images."));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
});

export const seriesImageUpload = seriesImageMulter.single("image");
