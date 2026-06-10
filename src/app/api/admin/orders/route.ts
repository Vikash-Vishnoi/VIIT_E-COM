import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page  = Math.max(1, Number(searchParams.get('page'))  || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip  = (page - 1) * limit;

    // Filters
    const filter: Record<string, any> = {};

    const search = searchParams.get('search');
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ orderId: regex }];
    }

    const status = searchParams.get('status');
    if (status && status !== 'all') filter.status = status;

    const paymentStatus = searchParams.get('paymentStatus');
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;

    const paymentMethod = searchParams.get('paymentMethod');
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;

    // Sort
    const sortParam = searchParams.get('sort') || 'newest';
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      total_asc:  { 'pricing.total':  1 },
      total_desc: { 'pricing.total': -1 },
    };
    const sortOrder = sortMap[sortParam] ?? sortMap.newest;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Stats (always from the full collection, no filter)
    const [totalOrders, placed, shipped, delivered, cancelled, revenue] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: 'Placed' }),
      Order.countDocuments({ status: 'Shipped' }),
      Order.countDocuments({ status: 'Delivered' }),
      Order.countDocuments({ status: 'Cancelled' }),
      Order.aggregate([
        { $match: { paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
    ]);

    return Response.json({
      success: true,
      data: orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        totalOrders,
        placed,
        shipped,
        delivered,
        cancelled,
        revenue: revenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/orders error:', error);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
