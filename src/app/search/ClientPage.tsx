"use client";

import Link from "next/link";
import CategoryFeedLayout from "@/components/CategoryFeedLayout";
import { FormattedProduct } from "@/components/ProductCard";
import { FeedSortKey } from "@/lib/feedTypes";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Props = {
  products: FormattedProduct[];
  searchQuery: string;
  currentSort: FeedSortKey;
  currentPage: number;
  totalPages: number;
  total: number;
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function SearchClientPage({
  products,
  searchQuery,
  currentSort,
  currentPage,
  totalPages,
  total,
}: Props) {
  const breadcrumbs = (
    <>
      <Link href="/" className="hover:text-black transition-colors">Home</Link>
      <span className="text-gray-300">/</span>
      <span className="text-black font-bold">Search results for "{searchQuery}"</span>
    </>
  );

  return (
    <CategoryFeedLayout
      products={products}
      total={total}
      totalPages={totalPages}
      currentPage={currentPage}
      currentSort={currentSort}
      breadcrumbs={breadcrumbs}
      // No navTabs for search
    />
  );
}
