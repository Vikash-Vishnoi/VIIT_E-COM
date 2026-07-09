import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Cart } from '@/models';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch only the total cart quantity for the user
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    
    // Use MongoDB aggregation to sum quantity directly in the database
    const result = await Cart.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } }
    ]);

    const count = result.length > 0 ? result[0].totalQuantity : 0;

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('GET /api/user/cart/count error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch cart count' }, { status: 500 });
  }
}
