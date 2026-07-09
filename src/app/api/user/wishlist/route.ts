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

    const minimizedWishlist = validWishlist.map((item: any) => {
      const p = item.productId;

      // Calculate stock
      let totalQty = 0;
      if (p.colors) {
        p.colors.forEach((c: any) => {
          if (c.sizes) {
            c.sizes.forEach((s: any) => {
              totalQty += s.quantity || 0;
            });
          }
        });
      }

      let firstImageUrl = null;
      if (p.colors && p.colors.length > 0 && p.colors[0].images && p.colors[0].images.length > 0) {
        firstImageUrl = p.colors[0].images[0].url;
      }

      return {
        productId: {
          _id: p._id,
          title: p.title,
          slug: p.slug,
          price: p.price,
          sellingPrice: p.sellingPrice,
          badge: p.badge,
          isActive: p.isActive,
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
      return NextResponse.json({ success: false, message: 'Product ID is required to update your wishlist' }, { status: 400 });
    }

    let { productId } = body;

    if (!productId) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, message: 'Invalid Product ID format' }, { status: 400 });
    }

    
    // Try deleting first (toggle off)
    const deleteResult = await Wishlist.deleteOne({ userId, productId });
    if (deleteResult.deletedCount > 0) {
      return NextResponse.json({ success: true, message: 'Removed from wishlist' });
    }
    
    // Validate productId exists and check wishlist limit in parallel
    const [productExists, currentCount] = await Promise.all([
      Product.exists({ _id: productId }),
      Wishlist.countDocuments({ userId })
    ]);

    if (!productExists) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    if (currentCount >= 20) {
      return NextResponse.json({ success: false, message: 'Wishlist limit reached. You can only save up to 20 items.' }, { status: 400 });
    }

    // Add it
    const newItem = await Wishlist.create({
      userId,
      productId,
    });

    return NextResponse.json({ success: true, message: 'Added to wishlist' });
  } catch (error: any) {
    console.error('POST /api/user/wishlist error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update wishlist' }, { status: 500 });
  }
}
