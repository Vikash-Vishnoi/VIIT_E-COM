import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { validateTitle, validateDescription, validatePrice, validateColors, validateCategory, validateBadge } from '@/lib/productValidation';

import { getAdminUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization: Ensure user is an active admin
    const adminId = await getAdminUser(req);
    if (!adminId) {
      return Response.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectDB();
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, message: 'Product data is required to create a product' }, { status: 400 });
    }

    const titleResult = validateTitle(body.title);
    if (!titleResult.isValid) return Response.json({ success: false, message: titleResult.error, errors: { title: titleResult.error } }, { status: 400 });

    const descResult = validateDescription(body.description);
    if (!descResult.isValid) return Response.json({ success: false, message: descResult.error, errors: { description: descResult.error } }, { status: 400 });

    const priceResult = validatePrice(body.price);
    if (!priceResult.isValid) return Response.json({ success: false, message: priceResult.error, errors: { price: priceResult.error } }, { status: 400 });

    const sellingPriceResult = validatePrice(body.sellingPrice);
    if (!sellingPriceResult.isValid) return Response.json({ success: false, message: 'Selling price must be a valid number greater than 0', errors: { sellingPrice: 'Selling price must be greater than 0' } }, { status: 400 });

    if (priceResult.value! < sellingPriceResult.value!) {
      return Response.json({ success: false, message: 'Regular price must be greater than or equal to selling price', errors: { price: 'Regular price must be greater than or equal to selling price' } }, { status: 400 });
    }

    let safeColors: any[] = [];
    if (body.colors !== undefined) {
      const cResult = validateColors(body.colors);
      if (!cResult.isValid) return Response.json({ success: false, message: cResult.error, errors: { colors: cResult.error } }, { status: 400 });
      safeColors = cResult.value || [];
    }

    // Validate category fields (same validators as PATCH route)
    const categoryResult = validateCategory(body.category, 'Category');
    if (!categoryResult.isValid) return Response.json({ success: false, message: categoryResult.error, errors: { category: categoryResult.error } }, { status: 400 });

    const subCategoryResult = validateCategory(body.subCategory, 'Sub-category');
    if (!subCategoryResult.isValid) return Response.json({ success: false, message: subCategoryResult.error, errors: { subCategory: subCategoryResult.error } }, { status: 400 });

    // subSubCategory is optional — only validate if provided
    let safeSubSubCategory = '';
    if (body.subSubCategory !== undefined && body.subSubCategory !== '') {
      const subSubResult = validateCategory(body.subSubCategory, 'Sub-sub-category');
      if (!subSubResult.isValid) return Response.json({ success: false, message: subSubResult.error, errors: { subSubCategory: subSubResult.error } }, { status: 400 });
      safeSubSubCategory = subSubResult.value!;
    }

    const badgeResult = validateBadge(body.badge);
    if (!badgeResult.isValid) return Response.json({ success: false, message: badgeResult.error, errors: { badge: badgeResult.error } }, { status: 400 });

    const safeData: any = {
      title: titleResult.value,
      category: categoryResult.value,
      subCategory: subCategoryResult.value,
      subSubCategory: safeSubSubCategory,
      description: descResult.value,
      price: priceResult.value,
      sellingPrice: sellingPriceResult.value,
      colors: safeColors,
      badge: badgeResult.value,
    };
    if (typeof body.isFeatured === 'boolean') safeData.isFeatured = body.isFeatured;
    if (typeof body.isActive === 'boolean') safeData.isActive = body.isActive;

    const product = new Product(safeData);
    await product.save();

    return Response.json({ success: true, message: 'Product added successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/products/create error:', error);
    
    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
      const fieldErrors: Record<string, string> = {};
      for (const field in error.errors) {
        fieldErrors[field] = error.errors[field].message;
      }
      return Response.json({ success: false, message: 'Validation failed', errors: fieldErrors }, { status: 400 });
    }

    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern['colors.sizes.sku']) {
        return Response.json({ success: false, message: 'One or more SKUs in this product already exist in the database. SKUs must be unique.', errors: { sku: 'SKU conflict detected' } }, { status: 400 });
      }
      return Response.json({ success: false, message: 'A product with this slug already exists', errors: { title: 'Title generates a duplicate slug' } }, { status: 400 });
    }
    return Response.json({ success: false, message: 'Failed to create product' }, { status: 500 });
  }
}
