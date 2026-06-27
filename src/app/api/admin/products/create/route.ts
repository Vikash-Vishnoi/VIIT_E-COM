import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, message: 'Product data is required to create a product' }, { status: 400 });
    }

    if (body.price === undefined || body.price <= 0) {
      return Response.json({ success: false, message: 'Regular price must be strictly greater than 0', errors: { price: 'Regular price must be greater than 0' } }, { status: 400 });
    }
    
    if (body.sellingPrice === undefined || body.sellingPrice <= 0) {
      return Response.json({ success: false, message: 'Selling price must be strictly greater than 0', errors: { sellingPrice: 'Selling price must be greater than 0' } }, { status: 400 });
    }

    if (body.price < body.sellingPrice) {
      return Response.json({ success: false, message: 'Regular price must be greater than or equal to selling price', errors: { price: 'Regular price must be greater than or equal to selling price' } }, { status: 400 });
    }

    // Generate unique productId if not provided
    if (!body.productId) {
      body.productId = `VIIT-${new Date().getFullYear()}-${Math.random().toString(10).slice(2, 6)}`;
    }

    // Generate slug if not provided
    if (!body.slug && body.title) {
      let baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      // Ensure unique slug
      const existing = await Product.findOne({ slug: baseSlug });
      if (existing) {
        baseSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }
      body.slug = baseSlug;
    }

    const product = new Product(body);
    await product.save();

    return Response.json({ success: true, data: product }, { status: 201 });
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
    return Response.json({ success: false, message: error.message || 'Failed to create product' }, { status: 500 });
  }
}
