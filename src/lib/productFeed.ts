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

  // ── Step 1: Build Query ─────────────────────────────────────────────────
  const query: any = { isActive: true };
  
  if (filter.by === 'category') {
    query.category = filter.slug;
  } else if (filter.by === 'subCategory') {
    query.subCategory = filter.slug;
  } else if (filter.by === 'subSubCategory') {
    query.subSubCategory = filter.slug;
  }

  // Only show in-stock products (at least one size in one color > 0)
  query['colors.sizes.quantity'] = { $gt: 0 };

  // ── Step 2: Determine final sort stage ──────────────────────────────────
  const sortStage: Record<string, 1 | -1> =
    sort === 'featured'   ? { popularityScore: -1, createdAt: -1 } :
    sort === 'new'        ? { createdAt: -1 }                      :
    sort === 'price-asc'  ? { sellingPrice: 1 }                    :
    sort === 'price-desc' ? { sellingPrice: -1 }                   :
    /* default */           { popularityScore: -1, createdAt: -1 };

  // ── Step 3: Execute optimized queries in parallel ───────────────────────
  const [total, rawProducts] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .sort(sortStage)
      .skip(skip)
      .limit(FEED_PAGE_SIZE)
      // Only select the fields required for the UI Card to save bandwidth
      .select('_id title slug sellingPrice price badge ratings colors')
      .lean()
  ]);

  const totalPages = Math.max(1, Math.ceil(total / FEED_PAGE_SIZE));

  // ── Step 4: Shape into FormattedProduct ─────────────────────────────────
  const products: FormattedProduct[] = (rawProducts as any[]).map((p) => ({
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
