import { PipelineStage } from 'mongoose';
import { Product } from '@/models';
import { FormattedProduct } from '@/components/ProductCard';
import {
  FEED_PAGE_SIZE,
  FeedSortKey,
  FeedFilter,
  SORT_OPTIONS,
  FeedResult,
} from '@/lib/feedTypes';

export type { FeedFilter };

export { FEED_PAGE_SIZE, SORT_OPTIONS };
export type { FeedSortKey, FeedResult };



// ─── Core Feed Function ──────────────────────────────────────────────────────
/**
 * Fetches and scores products for the category feed page.
 *
 * Algorithm:
 * The feedScore calculation has been moved to a database-level `popularityScore`
 * on the Product model (via pre-save hook and nightly cron job) to allow MongoDB
 * to utilize compound indexes for O(1) sorting and zero in-memory RAM usage.
 *
 * Out-of-stock products (totalQty === 0) are excluded from the feed entirely.
 * Stock quantity numbers are NOT exposed to the frontend.
 */
export async function fetchFeedProducts(
  filter: FeedFilter,
  sort: FeedSortKey,
  page: number,
): Promise<FeedResult> {
  const skip = (page - 1) * FEED_PAGE_SIZE;

  // ── Step 1: Initial Match (Pre-Unwind) ──────────────────────────────────
  const initialMatch: any = { 'colors.isActive': true };
  
  if (filter.by === 'category') {
    initialMatch.category = filter.slug;
  } else if (filter.by === 'subCategory') {
    initialMatch.subCategory = filter.slug;
  } else if (filter.by === 'subSubCategory') {
    initialMatch.subSubCategory = filter.slug;
  } else if (filter.by === 'search' && filter.q) {
    initialMatch.$text = { $search: filter.q };
  }

  // ── Step 2: Post-Unwind Match (Price & Stock & Active) ───────────────────────────
  const postUnwindMatch: any = { 
    'colors.sizes.quantity': { $gt: 0 },
    'colors.isActive': true 
  };

  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    postUnwindMatch['colors.sellingPrice'] = {};
    if (filter.minPrice !== undefined) postUnwindMatch['colors.sellingPrice'].$gte = filter.minPrice;
    if (filter.maxPrice !== undefined) postUnwindMatch['colors.sellingPrice'].$lte = filter.maxPrice;
  }

  // ── Step 3: Determine sort stage ────────────────────────────────────────
  // Sorting is now applied to the individual colors
  const sortStage: Record<string, 1 | -1> =
    sort === 'featured'   ? { 'colors.popularityScore': -1, createdAt: -1 } :
    sort === 'new'        ? { createdAt: -1 }                      :
    sort === 'price-asc'  ? { 'colors.sellingPrice': 1 }           :
    sort === 'price-desc' ? { 'colors.sellingPrice': -1 }          :
    /* default */           { 'colors.popularityScore': -1, createdAt: -1 };

  // ── Step 4: Execute Aggregation Pipeline ────────────────────────────────
  const pipeline: PipelineStage[] = [
    { $match: initialMatch },
    { $unwind: '$colors' },
    { $match: postUnwindMatch },
    { $sort: sortStage },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: FEED_PAGE_SIZE },
          {
            $project: {
              _id: 1,
              title: 1,
              slug: 1,
              'colors.colorName': 1,
              'colors.price': 1,
              'colors.sellingPrice': 1,
              'colors.badge': 1,
              'colors.ratings': 1,
              'colors.images': { $slice: ['$colors.images', 1] }, // First image of the color
            },
          },
        ],
      },
    },
  ];

  const [result] = await Product.aggregate(pipeline);

  const total = result?.metadata[0]?.total || 0;
  const rawProducts = result?.data || [];
  const totalPages = Math.max(1, Math.ceil(total / FEED_PAGE_SIZE));

  // ── Step 5: Shape into FormattedProduct ─────────────────────────────────
  const products: FormattedProduct[] = rawProducts.map((p: any) => {
    const color = p.colors;
    
    return {
      id:            `${p._id.toString()}-${color.colorName}`,
      name:          `${p.title} | ${color.colorName}`,
      price:         color.sellingPrice,
      originalPrice: color.price,
      pricePrefix:   undefined, // Not needed, explicit color is shown
      image:         color.images?.[0]?.url ?? '',
      badge:         color.badge ?? undefined,
      slug:          `${p.slug}?color=${encodeURIComponent(color.colorName)}`,
      ratings:       color.ratings ?? { average: 0, count: 0 },
    };
  });

  return {
    products,
    total,
    totalPages,
    currentPage: Math.min(page, totalPages),
  };
}
