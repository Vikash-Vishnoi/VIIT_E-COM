import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Order } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    // Filters
    const filter: Record<string, any> = {};
    
    const search = searchParams.get('search');
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { email: regex }, { mobile: regex }];
    }

    const role = searchParams.get('role');
    if (role === 'customer' || role === 'admin') filter.role = role;

    const status = searchParams.get('status');
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;

    const verified = searchParams.get('verified');
    if (verified === 'true') filter.isVerified = true;
    else if (verified === 'false') filter.isVerified = false;

    // Sort
    const sortParam = searchParams.get('sort') || 'newest';
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };
    const sortOrder = sortMap[sortParam] ?? sortMap.newest;

    // Projection — exclude sensitive data
    const projection = {
      _id: 1,
      name: 1,
      email: 1,
      mobile: 1,
      role: 1,
      isVerified: 1,
      isActive: 1,
      lastLoginAt: 1,
      createdAt: 1,
      // Return counts only
      cart: { $size: '$cart' },
      wishlist: { $size: '$wishlist' },
      address: { $size: '$address' },
    };

    // Use aggregation for $size
    const pipeline: any[] = [
      { $match: filter },
      { $addFields: {
        cartCount: { $size: { $ifNull: ['$cart', []] } },
        wishlistCount: { $size: { $ifNull: ['$wishlist', []] } },
        addressCount: { $size: { $ifNull: ['$address', []] } },
      }},
      { $project: {
        name: 1,
        email: 1,
        mobile: 1,
        role: 1,
        isVerified: 1,
        isActive: 1,
        lastLoginAt: 1,
        createdAt: 1,
        cartCount: 1,
        wishlistCount: 1,
        addressCount: 1,
      }},
      { $sort: sortOrder },
      { $skip: skip },
      { $limit: limit },
    ];

    const [users, totalArr] = await Promise.all([
      User.aggregate(pipeline),
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
        total: totalArr,
        totalPages: Math.ceil(totalArr / limit),
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
