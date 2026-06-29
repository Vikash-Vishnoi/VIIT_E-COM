import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, AdminAuditLog } from '@/models';

export const dynamic = 'force-dynamic';
import { getAdminUser } from '@/lib/auth';
import { validateObjectId } from '@/lib/productValidation';

type RouteContext = { params: Promise<{ id: string }> };

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
    }).select('isActive').lean();

    if (!updatedUser) {
      return Response.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Fire and forget audit log
    AdminAuditLog.create({
      adminId,
      action: 'USER_UPDATED',
      resourceId: updatedUser._id.toString(),
      resourceName: updatedUser.email,
      metadata: { fieldsUpdated: allowed },
    }).catch(err => console.error('[Audit] Failed to log USER_UPDATED:', err));

    return Response.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error('PATCH /api/admin/users/[id] error:', error);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
