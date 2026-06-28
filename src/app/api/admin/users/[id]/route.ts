import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User, Order } from '@/models';

export const dynamic = 'force-dynamic';
import { getAdminUser } from '@/lib/auth';
import { validateObjectId } from '@/lib/productValidation';

type RouteContext = { params: Promise<{ id: string }> };

// GET single user detail (excluding passwordHash)
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const adminId = await getAdminUser(_req);
    if (!adminId) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const idValidation = validateObjectId(id, 'user');
    if (!idValidation.isValid) {
      return Response.json({ success: false, message: idValidation.error }, { status: 400 });
    }

    const user = await User.findById(id).select('-passwordHash').lean();

    if (!user) {
      return Response.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: user });
  } catch (error) {
    console.error('GET /api/admin/users/[id] error:', error);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — only allow toggling isActive
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const adminId = await getAdminUser(req);
    if (!adminId) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const idValidation = validateObjectId(id, 'user');
    if (!idValidation.isValid) {
      return Response.json({ success: false, message: idValidation.error }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, message: 'Request body is required to update a user' }, { status: 400 });
    }


    // Only allow specific fields
    const allowed: Record<string, any> = {};
    if (typeof body.isActive === 'boolean') allowed.isActive = body.isActive;

    if (Object.keys(allowed).length === 0) {
      return Response.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(id, allowed, {
      new: true,
      runValidators: true,
    }).select('-passwordHash').lean();

    if (!updatedUser) {
      return Response.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error('PATCH /api/admin/users/[id] error:', error);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — soft delete (set isActive to false)
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const adminId = await getAdminUser(_req);
    if (!adminId) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const idValidation = validateObjectId(id, 'user');
    if (!idValidation.isValid) {
      return Response.json({ success: false, message: idValidation.error }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return Response.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Check if user has orders
    const orderCount = await Order.countDocuments({ userId: id });
    if (orderCount > 0) {
      // Soft delete — just deactivate
      user.isActive = false;
      await user.save();
      return Response.json({ success: true, message: `User deactivated (has ${orderCount} orders). Account preserved.` });
    }

    // No orders — still soft delete
    user.isActive = false;
    await user.save();
    return Response.json({ success: true, message: 'User has been deactivated.' });
  } catch (error: any) {
    console.error('DELETE /api/admin/users/[id] error:', error);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
