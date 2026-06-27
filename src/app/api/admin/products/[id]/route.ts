import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET  /api/admin/products/[id] ─────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return Response.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: product });
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
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, message: 'Product data is required to update this product' }, { status: 400 });
    }

    if (body.price !== undefined && body.sellingPrice !== undefined && body.price < body.sellingPrice) {
      return Response.json({ success: false, message: 'Regular price must be greater than or equal to selling price' }, { status: 400 });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedProduct) {
      return Response.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error('PATCH /api/admin/products/[id] error:', error);
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern['colors.sizes.sku']) {
        return Response.json({ success: false, message: 'One or more SKUs in this product already exist in the database. SKUs must be unique.' }, { status: 400 });
      }
      return Response.json({ success: false, message: 'A product with this slug already exists' }, { status: 400 });
    }
    return Response.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── DELETE  /api/admin/products/[id] ──────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return Response.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
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
