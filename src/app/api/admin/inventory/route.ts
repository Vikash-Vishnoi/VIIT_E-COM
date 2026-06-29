import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product, InventoryLog } from '@/models';
import { parseAdminQuery } from '@/lib/adminQueryParser';

export const dynamic = 'force-dynamic';
import { getAdminUser } from '@/lib/auth';

// GET /api/admin/inventory
export async function GET(req: NextRequest) {
  try {
    const adminId = await getAdminUser(req);
    if (!adminId) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);

    // ─── Common query parsing ─────────────────────────────────────────
    // Inventory has no URL-driven sort — quantity asc is always applied later
    const q = parseAdminQuery(searchParams, {
      sortWhitelist: { default: { quantity: 1, sku: 1 } },
      defaultSort: 'default',
    });
    if (!q.ok) return Response.json({ success: false, message: q.message }, { status: q.status });
    const { page, limit, skip, searchRegex } = q;

    const status = searchParams.get('status') || 'all';

    // searchRegex is built once — reused in both pipeline stages below
    const rootMatch: any = {};
    if (searchRegex) {
      rootMatch.$or = [{ title: searchRegex }, { 'colors.sizes.sku': searchRegex }];
    }

    const pipeline: any[] = [
      { $match: rootMatch },
      // Unwind colors and then sizes to get a flat list of SKUs
      { $unwind: '$colors' },
      { $unwind: '$colors.sizes' },
    ];

    if (searchRegex) {
      pipeline.push({
        $match: { $or: [{ title: searchRegex }, { 'colors.sizes.sku': searchRegex }] }
      });
    }

    // Filter by stock status
    if (status === 'out_of_stock') {
      pipeline.push({ $match: { 'colors.sizes.quantity': 0 } });
    } else if (status === 'low_stock') {
      pipeline.push({ $match: { 'colors.sizes.quantity': { $gt: 0, $lte: 10 } } });
    }

    // Projection for the table
    pipeline.push({
      $project: {
        _id: 1,
        productId: '$_id',
        title: 1,
        category: 1,
        image: { $arrayElemAt: ['$colors.images.url', 0] },
        colorName: '$colors.colorName',
        size: '$colors.sizes.size',
        sku: '$colors.sizes.sku',
        quantity: '$colors.sizes.quantity',
      }
    });

    // Sort by quantity ascending so lowest stock is at top
    pipeline.push({ $sort: { quantity: 1, sku: 1 } });

    // Pagination
    pipeline.push(
      { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$$ROOT' } } },
      { $project: { total: 1, data: { $slice: ['$data', skip, limit] } } }
    );

    const result = await Product.aggregate(pipeline);

    const items = result[0]?.data || [];
    const total = result[0]?.total || 0;

    // Fast global stats using aggregation on the whole collection
    const statsPipeline = [
      { $unwind: '$colors' },
      { $unwind: '$colors.sizes' },
      {
        $group: {
          _id: null,
          totalSkus: { $sum: 1 },
          lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$colors.sizes.quantity', 0] }, { $lte: ['$colors.sizes.quantity', 10] }] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$colors.sizes.quantity', 0] }, 1, 0] } }
        }
      }
    ];
    const statsResult = await Product.aggregate(statsPipeline);
    const stats = statsResult[0] || { totalSkus: 0, lowStock: 0, outOfStock: 0 };

    return Response.json({
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats
    });
  } catch (error) {
    console.error('GET /api/admin/inventory error:', error);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/inventory
// Expects: { productId: string, sku: string, newQuantity: number }
export async function PATCH(req: NextRequest) {
  try {
    const adminId = await getAdminUser(req);
    if (!adminId) return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, message: 'productId, sku and newQuantity are required to adjust stock' }, { status: 400 });
    }

    const { productId, sku, newQuantity } = body;

    if (!productId || !sku || typeof newQuantity !== 'number' || newQuantity < 0) {
      return Response.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return Response.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Find the specific variant
    let oldQuantity = 0;
    let found = false;

    for (const color of product.colors) {
      for (const size of color.sizes) {
        if (size.sku === sku) {
          oldQuantity = size.quantity;
          size.quantity = newQuantity;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      return Response.json({ success: false, message: 'SKU not found on this product' }, { status: 404 });
    }

    // Save product
    await product.save();

    // Log the change
    if (oldQuantity !== newQuantity) {
      await InventoryLog.create({
        productId,
        sku,
        changeType: 'adjustment',
        quantityChange: newQuantity - oldQuantity,
        quantityAfter: newQuantity,
        reference: 'Admin Manual Adjustment'
      });
    }

    return Response.json({ success: true, message: 'Stock updated' });
  } catch (error) {
    console.error('PATCH /api/admin/inventory error:', error);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
