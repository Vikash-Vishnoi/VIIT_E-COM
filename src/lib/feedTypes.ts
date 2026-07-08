// ─── Shared types & constants that are safe to import in both
//     server and client components (no mongoose / Node-only modules). ────────

import type { FormattedProduct } from '@/components/ProductCard';

export const FEED_PAGE_SIZE = 20;

export type FeedSortKey = 'featured' | 'new' | 'price-asc' | 'price-desc';

export const SORT_OPTIONS: { value: FeedSortKey; label: string }[] = [
  { value: 'featured',   label: 'Featured'         },
  { value: 'new',        label: 'New Arrivals'      },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
];

/** Discriminated union so the aggregation $match can filter by any category level. */
export type FeedFilter = (
  | { by: 'subSubCategory'; slug: string }
  | { by: 'subCategory';    slug: string }
  | { by: 'category';       slug: string }
  | { by: 'search';         q: string }
) & {
  minPrice?: number;
  maxPrice?: number;
};

export interface FeedResult {
  products: FormattedProduct[];
  total: number;
  totalPages: number;
  currentPage: number;
}

