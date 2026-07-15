/**
 * generate-favicons.mjs
 * 
 * Generates all favicon assets from the SVG source (client/public/favicon.svg).
 * Uses the KawaiCrafts scissors logo with brand colors.
 * 
 * Output files → client/public/
 *   favicon-16x16.png
 *   favicon-32x32.png
 *   apple-touch-icon.png    (180×180)
 *   android-chrome-192x192.png
 *   android-chrome-512x512.png
 *   favicon.ico             (multi-size: 16, 32, 48)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'client', 'public');
const SVG_SRC = path.join(PUBLIC, 'favicon.svg');

// Read the SVG source
const svgBuffer = fs.readFileSync(SVG_SRC);

// Define all sizes to generate
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generatePNGs() {
  for (const { name, size } of sizes) {
    const outPath = path.join(PUBLIC, name);
    await sharp(svgBuffer, { density: Math.max(300, size * 2) })
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✓ ${name} (${size}×${size})`);
  }
}

/**
 * Create a minimal ICO file containing 16×16, 32×32, and 48×48 PNGs.
 * ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
async function generateICO() {
  const icoSizes = [16, 32, 48];
  const pngBuffers = [];

  for (const size of icoSizes) {
    const buf = await sharp(svgBuffer, { density: Math.max(300, size * 4) })
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();
    pngBuffers.push({ size, data: buf });
  }

  // ICO header: 6 bytes
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;
  let dataOffset = headerSize + dirSize;

  // Calculate total file size
  let totalSize = dataOffset;
  for (const { data } of pngBuffers) {
    totalSize += data.length;
  }

  const ico = Buffer.alloc(totalSize);
  
  // ICO Header
  ico.writeUInt16LE(0, 0);       // Reserved
  ico.writeUInt16LE(1, 2);       // Type: 1 = ICO
  ico.writeUInt16LE(numImages, 4); // Number of images

  // Directory entries
  let offset = dataOffset;
  for (let i = 0; i < numImages; i++) {
    const { size, data } = pngBuffers[i];
    const entryOffset = headerSize + i * dirEntrySize;
    
    ico.writeUInt8(size < 256 ? size : 0, entryOffset);     // Width
    ico.writeUInt8(size < 256 ? size : 0, entryOffset + 1); // Height
    ico.writeUInt8(0, entryOffset + 2);                      // Color palette
    ico.writeUInt8(0, entryOffset + 3);                      // Reserved
    ico.writeUInt16LE(1, entryOffset + 4);                   // Color planes
    ico.writeUInt16LE(32, entryOffset + 6);                  // Bits per pixel
    ico.writeUInt32LE(data.length, entryOffset + 8);         // Size of image data
    ico.writeUInt32LE(offset, entryOffset + 12);             // Offset to image data

    data.copy(ico, offset);
    offset += data.length;
  }

  const outPath = path.join(PUBLIC, 'favicon.ico');
  fs.writeFileSync(outPath, ico);
  console.log(`✓ favicon.ico (${icoSizes.join(', ')}px)`);
}

async function main() {
  console.log('Generating KawaiCrafts favicons...\n');
  await generatePNGs();
  await generateICO();
  console.log('\n✅ All favicon assets generated in client/public/');
}

main().catch((err) => {
  console.error('Failed to generate favicons:', err);
  process.exit(1);
});
