import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';

export const dynamic = 'force-dynamic';
import { getAdminUser } from '@/lib/auth';
import { validateObjectId } from '@/lib/productValidation';

type RouteContext = { params: Promise<{ id: string }> };

// ─── PATCH  /api/admin/products/[id]/status ────────────────────────
// Toggle isActive or isFeatured only — no other fields allowed
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
      return Response.json({ success: false, message: 'Request body with isActive or isFeatured is required' }, { status: 400 });
    }

    // Only allow isActive and isFeatured — reject anything else
    const allowed: Record<string, boolean> = {};
    if (typeof body.isActive === 'boolean') allowed.isActive = body.isActive;
    if (typeof body.isFeatured === 'boolean') allowed.isFeatured = body.isFeatured;

    if (Object.keys(allowed).length === 0) {
      return Response.json(
        { success: false, message: 'No valid status fields provided. Allowed: isActive, isFeatured' },
        { status: 400 }
      );
    }

    const updated = await Product.findByIdAndUpdate(id, allowed, {
      new: true,
      runValidators: true,
      projection: { _id: 1, isActive: 1, isFeatured: 1 },
    }).lean();

    if (!updated) {
      return Response.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('PATCH /api/admin/products/[id]/status error:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
