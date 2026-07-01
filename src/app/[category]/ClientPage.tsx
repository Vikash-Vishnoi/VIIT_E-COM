"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";

import ProductCard, { FormattedProduct } from "@/components/ProductCard";
import { FeedSortKey, SORT_OPTIONS } from "@/lib/feedTypes";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type SubCatCard = { label: string; slug: string };

type Props = {
  products: FormattedProduct[];
  categorySlug: string;
  categoryLabel: string;

  /** Level-1 sub-categories — shown as tab pills (none are "active" at this level) */
  subCats: SubCatCard[];
  currentSort: FeedSortKey;
  currentPage: number;
  totalPages: number;
  total: number;
};

/* ─── Helper ─────────────────────────────────────────────────────────────── */

function buildUrl(pathname: string, sort: FeedSortKey, page: number): string {
  const p = new URLSearchParams();
  if (sort !== "featured") p.set("sort", sort);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

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
  const router   = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  /* ── Sibling tab scroll ──────────────────────────────────────────────── */
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = navRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    checkScroll();
    const el = navRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  function scrollNav(dir: "left" | "right") {
    navRef.current?.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  }

  /* ── Sort handler ────────────────────────────────────────────────────── */
  function handleSortChange(value: FeedSortKey) {
    startTransition(() => {
      router.push(buildUrl(pathname, value, 1));
    });
  }

  /* ── Pagination ──────────────────────────────────────────────────────── */
  function goToPage(page: number) {
    startTransition(() => {
      router.push(buildUrl(pathname, currentSort, page));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ── Price filter ────────────────────────────────────────────────────── */
  const [filterOpen, setFilterOpen] = useState(false);
  const minPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : 0;
  const maxPrice = products.length > 0 ? Math.max(...products.map((p) => p.price)) : 10000;
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);

  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const displayed = products.filter(
    (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
  );

  /* ── Pagination page numbers ─────────────────────────────────────────── */
  function getPageNumbers(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className={`min-h-screen bg-white transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="px-4 md:px-10 xl:px-16 pt-5 pb-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-black font-bold">{categoryLabel}</span>
        </nav>
      </div>

      {/* ── Sub-category tab bar ─────────────────────────────────────────── */}
      <div className="relative border-b border-gray-100 bg-white">
        {/* Left arrow */}
        <button
          aria-label="Scroll categories left"
          onClick={() => scrollNav("left")}
          className={`absolute left-0 top-0 bottom-0 z-10 flex items-center pl-3 pr-6 bg-gradient-to-r from-white via-white/95 to-transparent transition-opacity duration-200 ${
            canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </span>
        </button>

        {/* Scrollable pills — level-1 sub-categories, none are active here */}
        <div
          ref={navRef}
          className="flex items-center gap-2 px-4 md:px-10 xl:px-16 py-2.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
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
        </div>

        {/* Right arrow */}
        <button
          aria-label="Scroll categories right"
          onClick={() => scrollNav("right")}
          className={`absolute right-0 top-0 bottom-0 z-10 flex items-center pr-3 pl-6 bg-gradient-to-l from-white via-white/95 to-transparent transition-opacity duration-200 ${
            canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>
      </div>

      {/* ── Filter + Sort bar ─────────────────────────────────────────────── */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-gray-100">
        <div className="px-4 md:px-10 xl:px-16 flex items-center justify-between py-2.5 gap-3">

          <div className="flex items-center gap-3">
            <button
              id="filter-toggle"
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest rounded-full px-3.5 py-1.5 border transition-all duration-200 ${
                filterOpen
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-gray-200 hover:border-black hover:bg-gray-50"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Filter
            </button>
            <span className="text-[11px] text-gray-400 font-semibold">
              {total} {total === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap hidden sm:block">
              Sort:
            </label>
            <div className="relative">
              <select
                id="sort-select"
                value={currentSort}
                onChange={(e) => handleSortChange(e.target.value as FeedSortKey)}
                className="appearance-none text-[11px] font-black uppercase tracking-widest text-black border border-gray-200 rounded-full pl-3.5 pr-7 py-1.5 bg-white hover:border-black transition-colors outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Price range panel */}
        {filterOpen && products.length > 0 && minPrice < maxPrice && (
          <div className="px-4 md:px-10 xl:px-16 pb-5 pt-1 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Price Range</span>
                  <span className="text-[12px] font-black text-black">
                    ₹{priceRange[0].toLocaleString("en-IN")} – ₹{priceRange[1].toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="relative pt-1">
                  <div className="relative h-1 bg-gray-200 rounded-full">
                    <div
                      className="absolute h-1 bg-black rounded-full"
                      style={{
                        left: `${((priceRange[0] - minPrice) / (maxPrice - minPrice)) * 100}%`,
                        right: `${100 - ((priceRange[1] - minPrice) / (maxPrice - minPrice)) * 100}%`,
                      }}
                    />
                  </div>
                  <input
                    type="range" min={minPrice} max={maxPrice} step={100} value={priceRange[0]}
                    onChange={(e) => { const v = Number(e.target.value); if (v <= priceRange[1] - 100) setPriceRange([v, priceRange[1]]); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ zIndex: priceRange[0] > maxPrice - 200 ? 5 : 3 }}
                  />
                  <input
                    type="range" min={minPrice} max={maxPrice} step={100} value={priceRange[1]}
                    onChange={(e) => { const v = Number(e.target.value); if (v >= priceRange[0] + 100) setPriceRange([priceRange[0], v]); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ zIndex: 4 }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border-2 border-white shadow-md pointer-events-none"
                    style={{ left: `calc(${((priceRange[0] - minPrice) / (maxPrice - minPrice)) * 100}% - 8px)` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border-2 border-white shadow-md pointer-events-none"
                    style={{ left: `calc(${((priceRange[1] - minPrice) / (maxPrice - minPrice)) * 100}% - 8px)` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  <span>₹{minPrice.toLocaleString("en-IN")}</span>
                  <span>₹{maxPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button
                onClick={() => setPriceRange([minPrice, maxPrice])}
                className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black underline underline-offset-2 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Loading overlay ───────────────────────────────────────────────── */}
      {isPending && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Product Grid ──────────────────────────────────────────────────── */}
      <div className="px-3 md:px-10 xl:px-16 py-5 md:py-10">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm font-black uppercase tracking-widest text-gray-300">
              No products available right now
            </p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-gray-300">
              No items match your price filter on this page
            </p>
            <button
              onClick={() => setPriceRange([minPrice, maxPrice])}
              className="text-xs font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:opacity-60 transition-opacity"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <>
            {/* 2-col on mobile, 3-col on sm, 4-col on lg */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2.5 gap-y-6 md:gap-x-5 md:gap-y-10">
              {displayed.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-10 md:mt-16">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1 || isPending}
                  className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-gray-200 disabled:opacity-30 hover:bg-black hover:text-white transition-colors min-w-[60px] text-center"
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <div className="flex gap-1">
                  {getPageNumbers().map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p as number)}
                        disabled={isPending}
                        className={`w-9 h-9 flex items-center justify-center text-[11px] font-black transition-colors ${
                          currentPage === p ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"
                        }`}
                        aria-label={`Page ${p}`}
                        aria-current={currentPage === p ? "page" : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || isPending}
                  className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-gray-200 disabled:opacity-30 hover:bg-black hover:text-white transition-colors min-w-[60px] text-center"
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <p className="text-center text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-3">
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {total} items
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
