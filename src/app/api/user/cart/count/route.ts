import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Cart } from '@/models';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch only the total cart quantity for the user
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    
    // Fetch only the quantity field to minimize payload size and processing time
    const cartItems = await Cart.find({ userId })
      .select('quantity')
      .lean();

    const count = cartItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('GET /api/user/cart/count error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch cart count' }, { status: 500 });
  }
}
