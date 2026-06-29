import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { getAdminUser } from '@/lib/auth';
import { parseAdminQuery } from '@/lib/adminQueryParser';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminId = await getAdminUser(req);
    if (!adminId) {
      return Response.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = req.nextUrl;

    // ─── Common query parsing (pagination · search · sort) ────────────
    const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
      price_asc:  { sellingPrice:  1 },
      price_desc: { sellingPrice: -1 },
      newest:     { createdAt:    -1 },
      oldest:     { createdAt:     1 },
      title_asc:  { title:         1 },
      title_desc: { title:        -1 },
    };
    const q = parseAdminQuery(searchParams, { sortWhitelist: SORT_MAP, defaultSort: 'newest' });
    if (!q.ok) return Response.json({ success: false, message: q.message }, { status: q.status });
    const { page, limit, skip, searchRegex, sortOrder } = q;

    // ─── Filter ──────────────────────────────────────────────────────
    const filter: Record<string, unknown> = {};

    if (searchRegex) {
      filter.$or = [
        { title: searchRegex },
        { slug: searchRegex },
        { 'colors.sizes.sku': searchRegex },
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
      'colors.images': { $slice: 1 }, // first image per color (url + order — see note below)
      'colors.sizes.size': 1,         // sub-field projection excludes sku from wire payload
      'colors.sizes.quantity': 1,
      isFeatured: 1,
      isActive: 1,
      // Note: badge, ratings, createdAt removed — not needed in list view
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