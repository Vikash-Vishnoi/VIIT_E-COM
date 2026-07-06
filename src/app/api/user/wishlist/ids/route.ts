import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Wishlist } from '@/models';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch only wishlist product IDs for the user
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    
    const wishlist = await Wishlist.find({ userId })
      .select('productId')
      .lean();

    return NextResponse.json({ success: true, data: wishlist });
  } catch (error: any) {
    console.error('GET /api/user/wishlist/ids error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch wishlist IDs' }, { status: 500 });
  }
}
