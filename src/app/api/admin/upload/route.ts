/**
 * POST /api/admin/upload
 *
 * Accepts: multipart/form-data with:
 *   - file           : File   — the image to upload
 *   - subSubCategory : string — e.g. "Denim Jacket"  (required for naming)
 *   - folder         : string — Cloudinary folder    (default: "viit/products")
 *
 * Image naming convention (public_id):
 *   {sub-subcategory-slug}-{cloudinary-unique-id}
 *   e.g.  "denim-jacket-a3f9b2c1d4e5"
 *
 * Full Cloudinary path:
 *   viit/products/denim-jacket-a3f9b2c1d4e5
 *
 * Returns:
 *   { success: true, url, publicId, width, height, format, bytes }
 *
 * Allowed formats : jpg, jpeg, png, webp, avif
 * Max file size   : 10 MB (enforced server-side)
 */

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import cloudinary from '@/lib/cloudinary';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Converts any string into a URL-safe, lowercase slug.
 * "Denim Jacket" → "denim-jacket"
 * "Men's T-Shirt!!" → "mens-t-shirt"
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars (keep alphanumeric, space, hyphen)
    .replace(/[\s]+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-')             // collapse consecutive hyphens
    .replace(/^-|-$/g, '');          // strip leading/trailing hyphens
}

/**
 * Builds the Cloudinary public_id:
 *   {sub-subcategory-slug}-{8-char unique suffix}
 *   e.g. "denim-jacket-a3f9b2c1"
 */
function buildPublicId(subSubCategory: string): string {
  const slug   = slugify(subSubCategory) || 'product';
  const unique = randomUUID().replace(/-/g, '').slice(0, 12); // 12 hex chars
  return `${slug}-${unique}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData      = await req.formData();
    const file           = formData.get('file')           as File   | null;
    const subSubCategory = formData.get('subSubCategory') as string | null;
    const folder         = formData.get('folder')         as string | null;

    // ── Validate ────────────────────────────────────────────────────────────
    if (!file) {
      return Response.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!subSubCategory || subSubCategory.trim() === '') {
      return Response.json(
        { success: false, error: 'subSubCategory is required for image naming (e.g. "Denim Jacket")' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { success: false, error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return Response.json(
        { success: false, error: 'File too large. Maximum size is 10 MB.' },
        { status: 400 }
      );
    }

    // ── Build public_id: {sub-subcategory-slug}-{cloudinary-unique-id} ────────
    const publicId = buildPublicId(subSubCategory);
    // e.g. "denim-jacket-a3f9b2c1d4e5"

    // ── Convert File → Buffer → base64 data URI ──────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const base64      = buffer.toString('base64');
    const dataUri     = `data:${file.type};base64,${base64}`;

    // ── Upload to Cloudinary ─────────────────────────────────────────────────
    const result = await cloudinary.uploader.upload(dataUri, {
      folder:          folder ?? 'viit/products',
      public_id:       publicId,       // "denim-jacket-a3f9b2c1d4e5"
      use_filename:    false,          // we control the name via public_id
      unique_filename: false,          // already unique via randomUUID
      overwrite:       false,          // never overwrite existing images
      // Serve with auto quality + format via Cloudinary URL transformations
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
      ],
      resource_type: 'image',
    });

    // ── Respond ──────────────────────────────────────────────────────────────
    return Response.json(
      {
        success:  true,
        url:      result.secure_url,   // https://res.cloudinary.com/…
        publicId: result.public_id,    // used for deletion later
        width:    result.width,
        height:   result.height,
        format:   result.format,
        bytes:    result.bytes,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('[/api/admin/upload]', err);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/upload
 *
 * Body: { publicId: string }
 * Deletes an image from Cloudinary by its public_id.
 * Call this when admin removes an image from a product.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { publicId } = await req.json() as { publicId?: string };

    if (!publicId) {
      return Response.json(
        { success: false, error: 'publicId is required' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result !== 'ok') {
      return Response.json(
        { success: false, error: `Cloudinary: ${result.result}` },
        { status: 404 }
      );
    }

    return Response.json({ success: true, deleted: publicId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    console.error('[/api/admin/upload DELETE]', err);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
