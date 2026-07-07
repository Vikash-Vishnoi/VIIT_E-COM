import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch all orders for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    
    let page = parseInt(searchParams.get('page') || '1', 10);
    if (isNaN(page) || page < 1) page = 1;
    
    const limit = 20; // Hardcoded limit to prevent user manipulation
    
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId })
        .select('-__v -userId -updatedAt -items.productId -shippingAddress.isDefault -shippingAddress.createdAt -shippingAddress.updatedAt -shippingAddress.__v -shippingAddress.user')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId })
    ]);

    return NextResponse.json({ 
      success: true, 
      data: orders, 
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('GET /api/user/orders error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}
