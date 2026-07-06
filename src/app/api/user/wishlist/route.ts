import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Wishlist, Product } from '@/models';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch user's wishlist items
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    
    // Fetch and populate the product details
    const wishlist = await Wishlist.find({ userId })
      .populate({
        path: 'productId',
        select: 'title slug price sellingPrice colors badge isActive',
      })
      .sort({ addedAt: -1 })
      .lean();

    // Filter out items where the product has been deleted
    const validWishlist = wishlist.filter((item: any) => item.productId !== null);

    // Clean up orphaned wishlist items in the background
    const orphanedIds = wishlist.filter((item: any) => item.productId === null).map(item => item._id);
    if (orphanedIds.length > 0) {
      Wishlist.deleteMany({ _id: { $in: orphanedIds } }).exec().catch(console.error);
    }

    return NextResponse.json({ success: true, data: validWishlist });
  } catch (error: any) {
    console.error('GET /api/user/wishlist error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

// POST: Add or Toggle an item in the wishlist
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Product ID is required to update your wishlist' }, { status: 400 });
    }

    let { productId, colorName, size } = body;

    if (!productId) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    let isGenericToggle = false;

    // If color or size isn't provided (e.g. from a generic Product Card click), find the defaults
    if (!colorName || !size) {
      isGenericToggle = true;
      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
      }
      
      // Pick first color
      if (!colorName && product.colors && product.colors.length > 0) {
        colorName = product.colors[0].colorName;
      }
      // Pick first size from the selected color
      if (!size && product.colors && product.colors.length > 0 && product.colors[0].sizes && product.colors[0].sizes.length > 0) {
        size = product.colors[0].sizes[0].size;
      }
      
      // Fallbacks in case the product has no colors/sizes array defined
      if (!colorName) colorName = "Default";
      if (!size) size = "Default";
    }

    if (isGenericToggle) {
      // Check if ANY variant of this product exists to toggle it off (remove)
      const existingAny = await Wishlist.find({ userId, productId });
      if (existingAny.length > 0) {
        // Toggle off -> Remove ALL variants
        await Wishlist.deleteMany({ userId, productId });
        return NextResponse.json({ success: true, message: 'Removed from wishlist', action: 'removed' });
      }
    } else {
      // Check if SPECIFIC variant exists
      const existing = await Wishlist.findOne({ userId, productId, colorName, size });
      if (existing) {
        // Toggle off -> Remove it
        await Wishlist.deleteOne({ _id: existing._id });
        return NextResponse.json({ success: true, message: 'Removed from wishlist', action: 'removed' });
      }
    }

    // Add it
    const newItem = await Wishlist.create({
      userId,
      productId,
      colorName,
      size
    });

    return NextResponse.json({ success: true, message: 'Added to wishlist', action: 'added', data: newItem });
  } catch (error: any) {
    console.error('POST /api/user/wishlist error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update wishlist' }, { status: 500 });
  }
}
