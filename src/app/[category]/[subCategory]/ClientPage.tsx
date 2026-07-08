"use client";

import Link from "next/link";
import CategoryFeedLayout from "@/components/CategoryFeedLayout";
import { FormattedProduct } from "@/components/ProductCard";
import { FeedSortKey } from "@/lib/feedTypes";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type SubCatSibling = { label: string; slug: string };
export type SubCatChild   = { label: string; slug: string };

type Props = {
  products: FormattedProduct[];
  categorySlug: string;
  subCategorySlug: string;
  subCategoryLabel: string;
  siblings: SubCatSibling[];
  children: SubCatChild[];
  currentSort: FeedSortKey;
  currentPage: number;
  totalPages: number;
  total: number;
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function SubCategoryClientPage({
  products,
  categorySlug,
  subCategorySlug,
  subCategoryLabel,
  siblings,
  children,
  currentSort,
  currentPage,
  totalPages,
  total,
}: Props) {

  const breadcrumbs = (
    <>
      <Link href="/" className="hover:text-black transition-colors">Home</Link>
      <span className="text-gray-300">/</span>
      <Link href={`/${categorySlug}`} className="hover:text-black transition-colors capitalize">
        {categorySlug.replace(/-/g, " ")}
      </Link>
      <span className="text-gray-300">/</span>
      <span className="text-black font-bold">{subCategoryLabel}</span>
    </>
  );

  const navTabs = (
    <>
      {siblings.map((item) => {
        const isActive = item.slug === subCategorySlug;
        return (
          <Link
            key={item.slug}
            id={`nav-item-${item.slug}`}
            href={`/${categorySlug}/${item.slug}`}
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

      {children.length > 0 && siblings.length > 0 && (
        <span className="flex-shrink-0 w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />
      )}
      
      {children.map((child) => (
        <Link
          key={child.slug}
          href={`/${categorySlug}/${subCategorySlug}/${child.slug}`}
          className="flex-shrink-0 px-3.5 py-1 rounded-full border border-dashed border-gray-200 text-[10px] tracking-widest uppercase font-semibold text-gray-400 hover:border-gray-400 hover:text-black transition-all duration-200"
        >
          {child.label}
        </Link>
      ))}
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
      activeItemSlug={subCategorySlug}
    />
  );
}
