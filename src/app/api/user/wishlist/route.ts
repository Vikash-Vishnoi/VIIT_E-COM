import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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
        select: 'title slug colors.colorName colors.price colors.sellingPrice colors.images colors.sizes colors.badge colors.isActive colors.ratings colors.popularityScore badge isActive',
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

    const minimizedWishlist = validWishlist.map((item: any) => {
      const p = item.productId;
      const targetColor = p.colors?.find((c: any) => c.colorName === item.colorName);

      // Calculate stock for the specific color
      let totalQty = 0;
      if (targetColor && targetColor.sizes) {
        targetColor.sizes.forEach((s: any) => {
          totalQty += s.quantity || 0;
        });
      }

      let firstImageUrl = null;
      if (targetColor && targetColor.images && targetColor.images.length > 0) {
        firstImageUrl = targetColor.images[0].url;
      }

      return {
        _id: item._id,
        colorName: item.colorName,
        productId: {
          _id: p._id,
          title: p.title,
          slug: p.slug,
          price: targetColor?.price ?? 0,
          sellingPrice: targetColor?.sellingPrice ?? 0,
          badge: targetColor?.badge,
          isActive: targetColor?.isActive ?? false,
          ratings: targetColor?.ratings ?? { average: 0, count: 0 },
          popularityScore: targetColor?.popularityScore ?? 0,
          isOutOfStock: totalQty <= 0,
          colors: firstImageUrl ? [{ images: [{ url: firstImageUrl }] }] : []
        }
      };
    });

    return NextResponse.json({ success: true, data: minimizedWishlist });
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
      return NextResponse.json({ success: false, message: 'Product ID and color are required' }, { status: 400 });
    }

    let { productId, colorName } = body;

    if (!productId || !colorName) {
      return NextResponse.json({ success: false, message: 'Product ID and color are required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, message: 'Invalid Product ID format' }, { status: 400 });
    }

    
    // Try deleting first (toggle off)
    const deleteResult = await Wishlist.deleteOne({ userId, productId, colorName });
    if (deleteResult.deletedCount > 0) {
      return NextResponse.json({ success: true, message: 'Removed from wishlist' });
    }
    
    // Validate productId exists and check wishlist limit in parallel
    const [product, currentCount] = await Promise.all([
      Product.findById(productId).select('colors.colorName isActive'),
      Wishlist.countDocuments({ userId })
    ]);

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const colorExists = product.colors?.some((c: any) => c.colorName === colorName);
    if (!colorExists) {
      return NextResponse.json({ success: false, message: 'Product variant not found' }, { status: 404 });
    }

    if (currentCount >= 20) {
      return NextResponse.json({ success: false, message: 'Wishlist limit reached. You can only save up to 20 items.' }, { status: 400 });
    }

    // Add it
    const newItem = await Wishlist.create({
      userId,
      productId,
      colorName,
    });

    return NextResponse.json({ success: true, message: 'Added to wishlist' });
  } catch (error: any) {
    console.error('POST /api/user/wishlist error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update wishlist' }, { status: 500 });
  }
}
