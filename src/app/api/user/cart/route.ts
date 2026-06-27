import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Cart, Product } from '@/models';
import { verifyToken } from '@/lib/jwt';

// Helper to authenticate request
async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  if (typeof payload.userId !== 'string') return null;
  return payload.userId;
}

// GET: Fetch user's cart items
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    
    // Fetch and populate the product details
    const cartItems = await Cart.find({ userId })
      .populate({
        path: 'productId',
        select: 'title slug price sellingPrice colors badge isActive',
      })
      .sort({ addedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: cartItems });
  } catch (error: any) {
    console.error('GET /api/user/cart error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch cart' }, { status: 500 });
  }
}

// POST: Add an item to the cart
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    let body: any = {};
    try { body = await req.json(); } catch {}
    const { productId, colorName, size, quantity = 1 } = body;

    if (!productId || !colorName || !size) {
      return NextResponse.json({ success: false, message: 'Product ID, color, and size are required' }, { status: 400 });
    }

    // Check if it already exists to increment quantity
    const existing = await Cart.findOne({ userId, productId, colorName, size });
    
    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      return NextResponse.json({ success: true, message: 'Cart updated', action: 'updated', data: existing });
    }

    // Add it
    const newItem = await Cart.create({
      userId,
      productId,
      colorName,
      size,
      quantity
    });

    return NextResponse.json({ success: true, message: 'Added to cart', action: 'added', data: newItem });
  } catch (error: any) {
    console.error('POST /api/user/cart error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update cart' }, { status: 500 });
  }
}

// PATCH: Update quantity
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    let body: any = {};
    try { body = await req.json(); } catch {}
    const { cartItemId, quantity } = body;

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json({ success: false, message: 'Cart Item ID and quantity are required' }, { status: 400 });
    }

    if (quantity < 1) {
       // if quantity is 0, they should use DELETE, but we can handle it
       await Cart.deleteOne({ _id: cartItemId, userId });
       return NextResponse.json({ success: true, message: 'Item removed from cart' });
    }

    const updated = await Cart.findOneAndUpdate(
      { _id: cartItemId, userId },
      { quantity },
      { new: true }
    );

    if (!updated) {
       return NextResponse.json({ success: false, message: 'Item not found in your cart' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Cart updated', data: updated });
  } catch (error: any) {
    console.error('PATCH /api/user/cart error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update cart' }, { status: 500 });
  }
}

// DELETE: Remove an item entirely
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Cart Item ID is required' }, { status: 400 });
    }

    await connectDB();
    const result = await Cart.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Item not found in your cart' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Removed from cart' });
  } catch (error: any) {
    console.error('DELETE /api/user/cart error:', error);
    return NextResponse.json({ success: false, message: 'Failed to remove from cart' }, { status: 500 });
  }
}
