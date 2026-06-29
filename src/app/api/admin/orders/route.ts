import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models';
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
      newest:     { createdAt:       -1 },
      oldest:     { createdAt:        1 },
      total_asc:  { 'pricing.total':  1 },
      total_desc: { 'pricing.total': -1 },
    };
    const q = parseAdminQuery(searchParams, { sortWhitelist: SORT_MAP, defaultSort: 'newest' });
    if (!q.ok) return Response.json({ success: false, message: q.message }, { status: q.status });
    const { page, limit, skip, searchRegex, sortOrder } = q;

    // ─── Filters ─────────────────────────────────────────────────────
    const filter: Record<string, any> = {};

    if (searchRegex) {
      filter.$or = [{ orderId: searchRegex }];
    }

    const status = searchParams.get('status');
    if (status && status !== 'all') filter.status = status;

    const paymentStatus = searchParams.get('paymentStatus');
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;

    const paymentMethod = searchParams.get('paymentMethod');
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;



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
