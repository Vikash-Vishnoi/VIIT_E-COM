import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Wishlist } from '@/models';
import { verifyToken } from '@/lib/jwt';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  if (typeof payload.userId !== 'string') return null;
  return payload.userId;
}

// GET: Fast check if a specific product is wishlisted by the user
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: true, isWishlisted: false });

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });
    }

    await connectDB();
    const existing = await Wishlist.findOne({ userId, productId }).lean();

    return NextResponse.json({ success: true, isWishlisted: !!existing });
  } catch (error) {
    console.error('GET /api/user/wishlist/check error:', error);
    return NextResponse.json({ success: false, isWishlisted: false }, { status: 500 });
  }
}
