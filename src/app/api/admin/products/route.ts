import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;

    // ─── Pagination ──────────────────────────────────────────────────
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = 20; // Fixed limit for admin product listing
    const skip = (page - 1) * limit;

    // ─── Filter ──────────────────────────────────────────────────────
    const filter: Record<string, unknown> = {};

    const search = searchParams.get('search')?.trim();
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [
        { title: regex },
        { slug: regex },
        { 'colors.sizes.sku': regex },
      ];
    }

    const category = searchParams.get('category');
    if (category) filter.category = category;

    const status = searchParams.get('status');
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;

    const badge = searchParams.get('badge');
    if (badge) filter.badge = badge;

    const featured = searchParams.get('featured');
    if (featured === 'true') filter.isFeatured = true;

    const stock = searchParams.get('stock');
    if (stock === 'in_stock') {
      filter['colors.sizes.quantity'] = { $gt: 0 };
    } else if (stock === 'out_of_stock') {
      filter['colors.sizes.quantity'] = { $not: { $gt: 0 } };
    } else if (stock === 'has_out_of_stock_variants') {
      filter['colors.sizes.quantity'] = 0; // matches if ANY variant has quantity 0
    }

    // ─── Sort ────────────────────────────────────────────────────────
    const sortParam = searchParams.get('sort') || 'newest';
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { sellingPrice: 1 },
      price_desc: { sellingPrice: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      title_asc: { title: 1 },
      title_desc: { title: -1 },
    };
    const sortOrder = sortMap[sortParam] ?? sortMap.newest;

    // ─── Projection (list-view fields only) ──────────────────────────
    const projection = {
      _id: 1,
      productId: 1,
      category: 1,
      subCategory: 1,
      subSubCategory: 1,
      title: 1,
      slug: 1,
      price: 1,
      sellingPrice: 1,
      'colors.colorName': 1,
      'colors.images': { $slice: 1 }, // first image per color
      'colors.sizes': 1,
      badge: 1,
      isFeatured: 1,
      isActive: 1,
      ratings: 1,
      createdAt: 1,
    };

    // ─── Query ───────────────────────────────────────────────────────
    const [products, total] = await Promise.all([
      Product.find(filter, projection).sort(sortOrder).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/admin/products error:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}