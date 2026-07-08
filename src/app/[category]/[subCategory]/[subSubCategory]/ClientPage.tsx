"use client";

import Link from "next/link";
import CategoryFeedLayout from "@/components/CategoryFeedLayout";
import { FormattedProduct } from "@/components/ProductCard";
import { FeedSortKey } from "@/lib/feedTypes";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type SiblingCategory = {
  label: string;
  slug: string;
};

type ClientPageProps = {
  products: FormattedProduct[];
  categorySlug: string;
  subCategorySlug: string;
  subSubCategorySlug: string;
  subSubCategoryLabel: string;
  siblings: SiblingCategory[];
  currentSort: FeedSortKey;
  currentPage: number;
  totalPages: number;
  total: number;
};

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function SubCategoryClient({
  products,
  categorySlug,
  subCategorySlug,
  subSubCategorySlug,
  subSubCategoryLabel,
  siblings,
  currentSort,
  currentPage,
  totalPages,
  total,
}: ClientPageProps) {

  const breadcrumbs = (
    <>
      <Link href="/" className="hover:text-black transition-colors">Home</Link>
      <span className="text-gray-300">/</span>
      <span className="text-gray-400 capitalize">{categorySlug.replace(/-/g, " ")}</span>
      <span className="text-gray-300">/</span>
      <span className="text-black font-bold">{subSubCategoryLabel}</span>
    </>
  );

  const navTabs = (
    <>
      {siblings.map((item) => {
        const isActive = item.slug === subSubCategorySlug;
        return (
          <Link
            key={item.slug}
            id={`nav-item-${item.slug}`}
            href={`/${categorySlug}/${subCategorySlug}/${item.slug}`}
            className={`flex-shrink-0 px-4 py-1 rounded-full border text-[11px] tracking-widest uppercase transition-all duration-200 ${
              isActive
                ? "bg-black text-white border-black font-black"
                : "bg-white text-gray-400 border-gray-100 font-bold hover:border-gray-300 hover:text-black"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
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
      navTabs={navTabs}
      activeItemSlug={subSubCategorySlug}
    />
  );
}
