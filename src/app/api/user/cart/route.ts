import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Cart, Product } from '@/models';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch user's cart items
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    // Fetch and populate the product details
    const cartItems = await Cart.find({ userId })
      .select('-userId -addedAt -createdAt -updatedAt -__v')
      .populate({
        path: 'productId',
        select: '-_id title slug price sellingPrice colors.colorName colors.images colors.sizes isActive badge',
      })
      .sort({ addedAt: -1 })
      .lean();

    const validCartItems = cartItems.filter((item: any) => item.productId !== null);

    // Clean up orphaned cart items
    const orphanedIds = cartItems.filter((item: any) => item.productId === null).map(item => item._id);
    if (orphanedIds.length > 0) {
      Cart.deleteMany({ _id: { $in: orphanedIds } }).exec().catch(console.error);
    }

    const processedCartItems = validCartItems.map((item: any) => {
      const p = item.productId;
      item.isUnavailable = p.isActive === false;

      // Calculate stock for the specific variant
      let availableQty = 0;
      if (p.colors) {
        const color = p.colors.find((c: any) => c.colorName === item.colorName);
        if (color && color.sizes) {
          const sizeObj = color.sizes.find((s: any) => s.size === item.size);
          if (sizeObj) {
            availableQty = sizeObj.quantity || 0;
          }
        }
      }

      item.isOutOfStock = availableQty <= 0;
      item.availableQuantity = availableQty;

      // Strip sizes to minimize payload size
      if (item.productId && item.productId.colors) {
        item.productId.colors.forEach((c: any) => {
          delete c.sizes;
        });
      }

      return item;
    });

    return NextResponse.json({ success: true, data: processedCartItems });
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
    try { body = await req.json(); } catch { }
    const { productId, colorName, size, quantity = 1 } = body;

    if (!productId || !colorName || !size) {
      return NextResponse.json({ success: false, message: 'Product ID, color, and size are required' }, { status: 400 });
    }

    // 1. Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, message: 'Invalid Product ID format' }, { status: 400 });
    }

    // 2. Validate payload limits
    if (typeof colorName !== 'string' || colorName.length > 50) {
      return NextResponse.json({ success: false, message: 'Invalid color name' }, { status: 400 });
    }
    if (typeof size !== 'string' || size.length > 20) {
      return NextResponse.json({ success: false, message: 'Invalid size format' }, { status: 400 });
    }

    // 3. Validate quantity limit
    if (typeof quantity !== 'number' || quantity < 1 || quantity > 20) {
      return NextResponse.json({ success: false, message: 'Quantity must be between 1 and 20' }, { status: 400 });
    }

    // 4. Validate existence in DB and check if it already exists in cart (Parallel)
    const [product, existing] = await Promise.all([
      Product.findById(productId).select('_id isActive colors.colorName colors.sizes'),
      Cart.findOne({ userId, productId, colorName, size }).select('_id quantity')
    ]);

    if (!product || !product.isActive) {
      return NextResponse.json({ success: false, message: 'Product not found or unavailable' }, { status: 404 });
    }

    const colorObj = product.colors?.find((c: any) => c.colorName === colorName);
    if (!colorObj) {
      return NextResponse.json({ success: false, message: 'Selected color is not available' }, { status: 400 });
    }

    const sizeObj = colorObj.sizes?.find((s: any) => s.size === size);
    if (!sizeObj) {
      return NextResponse.json({ success: false, message: 'Selected size is not available' }, { status: 400 });
    }

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > 20) {
        return NextResponse.json({ success: false, message: 'Maximum limit of 20 items per product reached' }, { status: 400 });
      }
      if (newQuantity > sizeObj.quantity) {
        return NextResponse.json({ success: false, message: 'Not enough stock available' }, { status: 400 });
      }

      existing.quantity = newQuantity;
      await existing.save();
      return NextResponse.json({ success: true, message: 'Cart updated' });
    }

    if (quantity > sizeObj.quantity) {
      return NextResponse.json({ success: false, message: 'Not enough stock available' }, { status: 400 });
    }

    // Add it
    const newItem = await Cart.create({
      userId,
      productId,
      colorName,
      size,
      quantity
    });

    return NextResponse.json({ success: true, message: 'Added to cart' });
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
    try { body = await req.json(); } catch { }
    const { cartItemId, quantity } = body;

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json({ success: false, message: 'Cart Item ID and quantity are required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
      return NextResponse.json({ success: false, message: 'Invalid Cart Item ID format' }, { status: 400 });
    }

    if (typeof quantity !== 'number' || quantity > 20) {
      return NextResponse.json({ success: false, message: 'Quantity must be a number and cannot exceed 20' }, { status: 400 });
    }

    if (quantity < 1) {
      // if quantity is 0, they should use DELETE, but we can handle it
      await Cart.deleteOne({ _id: cartItemId, userId });
      return NextResponse.json({ success: true, message: 'Item removed from cart' });
    }

    const cartItem = await Cart.findOne({ _id: cartItemId, userId }).select('productId colorName size quantity');
    if (!cartItem) {
      return NextResponse.json({ success: false, message: 'Item not found in your cart' }, { status: 404 });
    }

    // Validate against product stock
    const product = await Product.findById(cartItem.productId).select('_id isActive colors.colorName colors.sizes');
    if (!product || !product.isActive) {
      return NextResponse.json({ success: false, message: 'Product not found or unavailable' }, { status: 404 });
    }

    const colorObj = product.colors?.find((c: any) => c.colorName === cartItem.colorName);
    const sizeObj = colorObj?.sizes?.find((s: any) => s.size === cartItem.size);

    if (!sizeObj) {
      return NextResponse.json({ success: false, message: 'Selected variant is not available' }, { status: 400 });
    }

    if (quantity > sizeObj.quantity) {
      return NextResponse.json({ success: false, message: 'Not enough stock available' }, { status: 400 });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    return NextResponse.json({ success: true, message: 'Cart updated' });
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid Cart Item ID format' }, { status: 400 });
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
