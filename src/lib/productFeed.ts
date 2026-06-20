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
 * Algorithm (score breakdown):
 *  - Featured boost  : isFeatured = +100
 *  - Badge boost     : Best Seller=+50 | New=+40 | Limited=+35 | Sale=+30
 *  - Rating score    : confidence-weighted rating, max +25
 *                      = (avg/5) * 25 * clamp(count/30, 0, 1)
 *  - Recency score   : max +35, decays linearly to 0 after 35 days
 *                      = max(0, 35 - daysSinceCreated)
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
  const now = new Date();

  // ── Step 1: Determine final sort stage ──────────────────────────────────
  //   'featured' uses the computed feedScore.
  //   Other sorts bypass the score and use a simple field sort.
  const sortStage: Record<string, 1 | -1> =
    sort === 'featured'   ? { feedScore: -1, createdAt: -1 } :
    sort === 'new'        ? { createdAt: -1 }                :
    sort === 'price-asc'  ? { sellingPrice: 1 }              :
    sort === 'price-desc' ? { sellingPrice: -1 }             :
    /* default */           { feedScore: -1, createdAt: -1 };

  // ── Step 2: Aggregation pipeline ────────────────────────────────────────
  const pipeline: PipelineStage[] = [
    // 2a. Active products matching the requested category level
    {
      $match: {
        [filter.by]: filter.slug,
        isActive: true,
      },
    },

    // 2b. Compute total available quantity across all colors & sizes
    {
      $addFields: {
        _totalQty: {
          $sum: {
            $map: {
              input: '$colors',
              as: 'c',
              in: { $sum: '$$c.sizes.quantity' },
            },
          },
        },
      },
    },

    // 2c. Exclude out-of-stock products from the feed
    {
      $match: { _totalQty: { $gt: 0 } },
    },

    // 2d. Compute recency (days since created)
    {
      $addFields: {
        _daysSinceCreated: {
          $divide: [
            { $subtract: [now, '$createdAt'] },
            86_400_000, // ms per day
          ],
        },
      },
    },

    // 2e. Compute feedScore (only matters when sort === 'featured')
    {
      $addFields: {
        feedScore: {
          $add: [
            // Featured boost: +100
            { $cond: ['$isFeatured', 100, 0] },

            // Badge boost
            {
              $switch: {
                branches: [
                  { case: { $eq: ['$badge', 'Best Seller'] }, then: 50 },
                  { case: { $eq: ['$badge', 'New'] },         then: 40 },
                  { case: { $eq: ['$badge', 'Limited'] },     then: 35 },
                  { case: { $eq: ['$badge', 'Sale'] },        then: 30 },
                ],
                default: 0,
              },
            },

            // Rating score (max +25, confidence-weighted)
            // = (avg / 5) * 25 * clamp(count / 30, 0, 1)
            {
              $multiply: [
                { $divide: ['$ratings.average', 5] },
                25,
                { $min: [{ $divide: ['$ratings.count', 30] }, 1] },
              ],
            },

            // Recency score (max +35 on day 0, decays to 0 at day 35)
            {
              $max: [
                0,
                { $subtract: [35, '$_daysSinceCreated'] },
              ],
            },
          ],
        },
      },
    },

    // 2f. Sort
    { $sort: sortStage },
  ];

  // ── Step 3: Run count + paginated fetch in parallel ──────────────────────
  const countPipeline: PipelineStage[] = [...pipeline, { $count: 'total' } as PipelineStage];
  const dataPipeline: PipelineStage[] = [
    ...pipeline,
    { $skip: skip },
    { $limit: FEED_PAGE_SIZE },
    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        sellingPrice: 1,
        price: 1,
        badge: 1,
        ratings: 1,
        // Return only first image of first color for the card
        colors: {
          $slice: [
            {
              $map: {
                input: '$colors',
                as: 'c',
                in: {
                  colorName: '$$c.colorName',
                  images: { $slice: ['$$c.images', 1] },
                },
              },
            },
            1, // first color only
          ],
        },
      },
    },
  ];

  const [countResult, rawProducts] = await Promise.all([
    Product.aggregate(countPipeline),
    Product.aggregate(dataPipeline),
  ]);

  const total: number = countResult[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / FEED_PAGE_SIZE));

  // ── Step 4: Shape into FormattedProduct ─────────────────────────────────
  const products: FormattedProduct[] = rawProducts.map((p) => ({
    id:            (p._id as { toString(): string }).toString(),
    name:          p.title,
    price:         p.sellingPrice,
    originalPrice: p.price,
    image:         p.colors?.[0]?.images?.[0]?.url ?? '',
    badge:         p.badge ?? undefined,
    slug:          p.slug,
    ratings:       p.ratings ?? { average: 0, count: 0 },
  }));

  return {
    products,
    total,
    totalPages,
    currentPage: Math.min(page, totalPages),
  };
}
