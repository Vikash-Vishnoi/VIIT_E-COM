import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { 
  validateTitle, validateDescription, validateObjectId,
  validateCategory, validateBadge, validateBoolean, validateColors, validatePricing 
} from '@/lib/productValidation';
export const dynamic = 'force-dynamic';
import { getAdminUser } from '@/lib/auth';
import { deleteImageFromCloudinary } from '@/lib/cloudinary';
import { AdminAuditLog } from '@/models';

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET  /api/admin/products/[id] ─────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const adminId = await getAdminUser(_req);
    if (!adminId) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const idValidation = validateObjectId(id, 'product');
    if (!idValidation.isValid) {
      return Response.json({ success: false, message: idValidation.error }, { status: 400 });
    }

    const product = await Product.findById(id)
      .select('_id category subCategory subSubCategory title description price sellingPrice colors badge isFeatured isActive')
      .lean();

    if (!product) {
      return Response.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // Shape response — strip sku from sizes (cannot exclude nested sub-fields via .select alone)
    const shaped = {
      _id:            product._id,
      category:       product.category,
      subCategory:    product.subCategory,
      subSubCategory: product.subSubCategory,
      title:          product.title,
      description:    product.description,
      price:          product.price,
      sellingPrice:   product.sellingPrice,
      badge:          product.badge,
      isFeatured:     product.isFeatured,
      isActive:       product.isActive,
      colors: (product.colors as any[]).map((c: any) => ({
        colorName: c.colorName,
        images:    c.images.map((img: any) => ({ url: img.url, order: img.order })),
        sizes:     c.sizes.map((s: any)   => ({ size: s.size, quantity: s.quantity })),
      })),
    };
    return Response.json({ success: true, data: shaped });
  } catch (error) {
    console.error('GET /api/admin/products/[id] error:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── PATCH  /api/admin/products/[id] ───────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const adminId = await getAdminUser(req);
    if (!adminId) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const idValidation = validateObjectId(id, 'product');
    if (!idValidation.isValid) {
      return Response.json({ success: false, message: idValidation.error }, { status: 400 });
    } 

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, message: 'Product data is required to update this product' }, { status: 400 });
    }

    // Fetch existing product to aid in cross-validation and defaults
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return Response.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const safeData: any = {};

    if (body.category !== undefined) {
      const res = validateCategory(body.category, 'Category');
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      safeData.category = res.value;
    }
    
    if (body.subCategory !== undefined) {
      const res = validateCategory(body.subCategory, 'Sub-category');
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      safeData.subCategory = res.value;
    }
    
    if (body.subSubCategory !== undefined) {
      const res = validateCategory(body.subSubCategory, 'Sub-sub-category');
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      safeData.subSubCategory = res.value;
    }

    if (body.isFeatured !== undefined) {
      const res = validateBoolean(body.isFeatured, 'isFeatured');
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      safeData.isFeatured = res.value;
    }

    if (body.isActive !== undefined) {
      const res = validateBoolean(body.isActive, 'isActive');
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      safeData.isActive = res.value;
    }

    if (body.title !== undefined) {
      const res = validateTitle(body.title);
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      safeData.title = res.value;
    }

    if (body.description !== undefined) {
      const res = validateDescription(body.description);
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      safeData.description = res.value;
    }

    if (body.badge !== undefined) {
      const res = validateBadge(body.badge);
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      safeData.badge = res.value;
    }

    if (body.price !== undefined || body.sellingPrice !== undefined) {
      const res = validatePricing(body.price, body.sellingPrice, existingProduct);
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      if (body.price !== undefined) safeData.price = res.price;
      if (body.sellingPrice !== undefined) safeData.sellingPrice = res.sellingPrice;
    }

    if (body.colors !== undefined) {
      const res = validateColors(body.colors);
      if (!res.isValid) return Response.json({ success: false, message: res.error }, { status: 400 });
      safeData.colors = res.value;

      // Cleanup orphaned Cloudinary images
      const oldImages = existingProduct.colors.flatMap((c: any) => c.images.map((img: any) => img.url));
      const newImages = safeData.colors.flatMap((c: any) => c.images.map((img: any) => img.url));
      const imagesToDelete = oldImages.filter((url: string) => !newImages.includes(url));
      
      if (imagesToDelete.length > 0) {
        // Fire and forget deletions to not block the request
        Promise.all(imagesToDelete.map((url: string) => deleteImageFromCloudinary(url))).catch(err => console.error("Failed background image deletion", err));
      }
    }

    Object.assign(existingProduct, safeData);
    const updatedProduct = await existingProduct.save();

    if (!updatedProduct) {
      return Response.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // Shape response — strip internal fields + sku from sizes (free: doc already in memory after .save())
    const shaped = {
      _id:            updatedProduct._id,
      category:       updatedProduct.category,
      subCategory:    updatedProduct.subCategory,
      subSubCategory: updatedProduct.subSubCategory,
      title:          updatedProduct.title,
      description:    updatedProduct.description,
      price:          updatedProduct.price,
      sellingPrice:   updatedProduct.sellingPrice,
      badge:          updatedProduct.badge,
      isFeatured:     updatedProduct.isFeatured,
      isActive:       updatedProduct.isActive,
      colors: updatedProduct.colors.map((c: any) => ({
        colorName: c.colorName,
        images:    c.images.map((img: any) => ({ url: img.url, order: img.order })),
        sizes:     c.sizes.map((s: any)   => ({ size: s.size, quantity: s.quantity })),
      })),
    };
    return Response.json({ success: true, data: shaped });
  } catch (error: any) {
    console.error('PATCH /api/admin/products/[id] error:', error);
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern['colors.sizes.sku']) {
        return Response.json({ success: false, message: 'One or more SKUs in this product already exist in the database. SKUs must be unique.' }, { status: 400 });
      }
      return Response.json({ success: false, message: 'A product with this slug already exists' }, { status: 400 });
    }
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── DELETE  /api/admin/products/[id] ──────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const adminId = await getAdminUser(_req);
    if (!adminId) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const idValidation = validateObjectId(id, 'product');
    if (!idValidation.isValid) {
      return Response.json({ success: false, message: idValidation.error }, { status: 400 });
    }

    const deleted = await Product.findByIdAndDelete(id, {
      projection: {
        title: 1,
        productId: 1,
        category: 1,
        subCategory: 1,
        slug: 1,
        sellingPrice: 1,
        isActive: 1,
        'colors.images.url': 1, // only URLs needed for Cloudinary cleanup
      },
    });

    if (!deleted) {
      return Response.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // Write immutable audit record BEFORE fire-and-forget cleanup
    await AdminAuditLog.create({
      adminId,
      action: 'PRODUCT_DELETED',
      resourceId: id,
      resourceName: deleted.title,
      metadata: {
        productId:    deleted.productId,
        category:     deleted.category,
        subCategory:  deleted.subCategory,
        slug:         deleted.slug,
        sellingPrice: deleted.sellingPrice,
        isActive:     deleted.isActive,
      },
    });

    // Cleanup all Cloudinary images associated with this product
    const imagesToDelete = deleted.colors.flatMap((c: any) => c.images.map((img: any) => img.url));
    if (imagesToDelete.length > 0) {
      Promise.all(imagesToDelete.map((url: string) => deleteImageFromCloudinary(url)))
        .catch(err => console.error("Failed background image deletion on product delete", err));
    }

    return Response.json({ success: true, deleted: id });
  } catch (error) {
    console.error('DELETE /api/admin/products/[id] error:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
