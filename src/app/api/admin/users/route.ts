import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { parseAdminQuery } from '@/lib/adminQueryParser';

export const dynamic = 'force-dynamic';
import { getAdminUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const adminId = await getAdminUser(req);
    if (!adminId) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);

    // ─── Common query parsing ─────────────────────────────────────────
    const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
      newest:    { createdAt: -1 },
      oldest:    { createdAt:  1 },
      name_asc:  { name:       1 },
      name_desc: { name:      -1 },
    };
    const q = parseAdminQuery(searchParams, { sortWhitelist: SORT_MAP, defaultSort: 'newest' });
    if (!q.ok) return Response.json({ success: false, message: q.message }, { status: q.status });
    const { page, limit, skip, searchRegex, sortOrder } = q;

    // ─── Filters ─────────────────────────────────────────────────────
    const filter: Record<string, any> = {};

    if (searchRegex) {
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { mobile: searchRegex }];
    }

    const role = searchParams.get('role');
    if (role === 'customer' || role === 'admin') filter.role = role;

    const status = searchParams.get('status');
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;

    const verified = searchParams.get('verified');
    if (verified === 'true') filter.isVerified = true;
    else if (verified === 'false') filter.isVerified = false;



    const [users, total] = await Promise.all([
      User.find(filter)
        .select('_id name email mobile role isVerified isActive createdAt lastLoginAt')
        .sort(sortOrder as any)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Stats
    const [totalUsers, activeUsers, adminUsers, verifiedUsers] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isVerified: true }),
    ]);

    return Response.json({
      success: true,
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        verifiedUsers,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
