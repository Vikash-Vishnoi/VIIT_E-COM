"use client";

import Link from "next/link";
import CategoryFeedLayout from "@/components/CategoryFeedLayout";
import { FormattedProduct } from "@/components/ProductCard";
import { FeedSortKey } from "@/lib/feedTypes";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type SubCatCard = { label: string; slug: string };

type Props = {
  products: FormattedProduct[];
  categorySlug: string;
  categoryLabel: string;
  subCats: SubCatCard[];
  currentSort: FeedSortKey;
  currentPage: number;
  totalPages: number;
  total: number;
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function CategoryClientPage({
  products,
  categorySlug,
  categoryLabel,
  subCats,
  currentSort,
  currentPage,
  totalPages,
  total,
}: Props) {
  
  const breadcrumbs = (
    <>
      <Link href="/" className="hover:text-black transition-colors">Home</Link>
      <span className="text-gray-300">/</span>
      <span className="text-black font-bold">{categoryLabel}</span>
    </>
  );

  const navTabs = subCats.length > 0 ? (
    <>
      {subCats.map((sub) => (
        <Link
          key={sub.slug}
          id={`nav-item-${sub.slug}`}
          href={`/${categorySlug}/${sub.slug}`}
          className="flex-shrink-0 px-4 py-1 rounded-full border text-[11px] tracking-widest uppercase transition-all duration-200 bg-white text-gray-400 border-gray-100 font-bold hover:border-gray-300 hover:text-black"
        >
          {sub.label}
        </Link>
      ))}
    </>
  ) : undefined;

  return (
    <CategoryFeedLayout
      products={products}
      total={total}
      totalPages={totalPages}
      currentPage={currentPage}
      currentSort={currentSort}
      breadcrumbs={breadcrumbs}
      navTabs={navTabs}
    />
  );
}
