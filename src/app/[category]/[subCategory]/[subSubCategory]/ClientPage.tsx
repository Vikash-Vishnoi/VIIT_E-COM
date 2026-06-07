"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

/* ─── Types ────────────────────────────────────────────── */

import ProductCard, { FormattedProduct } from "@/components/ProductCard";


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
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

export default function SubCategoryClient({
  products,
  categorySlug,
  subCategorySlug,
  subSubCategorySlug,
  subSubCategoryLabel,
  siblings,
}: ClientPageProps) {
  /* scroll arrows */
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  /* Pagination */
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

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

  useEffect(() => {
    // Auto-scroll the active pill into the center of the view
    const activeEl = document.getElementById(`nav-item-${subSubCategorySlug}`);
    if (activeEl && navRef.current) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [subSubCategorySlug]);

  function scrollNav(dir: "left" | "right") {
    navRef.current?.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  }

  /* filter & sort */
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "new">("default");

  // Handle case with 0 products
  const minPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : 0;
  const maxPrice = products.length > 0 ? Math.max(...products.map((p) => p.price)) : 10000;
  
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);

  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Reset page to 0 if filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [priceRange]);

  const filtered = products
    .filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "new") return (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice(currentPage * limit, (currentPage + 1) * limit);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Breadcrumb ────────────────────────── */}
      <div className="px-6 md:px-10 xl:px-16 pt-8 pb-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-400 capitalize">{categorySlug.replace(/-/g, ' ')}</span>
          <span className="text-gray-300">/</span>
          <span className="text-black font-bold">{subSubCategoryLabel}</span>
        </nav>
      </div>

      {/* ── Sub-category scroll nav ───────────── */}
      <div className="relative border-b border-gray-100 bg-white">
        {/* Left Arrow */}
        <button
          aria-label="Scroll categories left"
          onClick={() => scrollNav("left")}
          className={`absolute left-0 top-0 bottom-0 z-10 flex items-center pl-3 pr-6 bg-gradient-to-r from-white via-white/95 to-transparent transition-opacity duration-200 ${canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </span>
        </button>

        {/* Scrollable pills */}
        <div
          ref={navRef}
          className="flex items-center gap-2 px-6 md:px-10 xl:px-16 py-3 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {siblings.map((item) => {
            const isActive = item.slug === subSubCategorySlug;
            return (
              <Link
                key={item.slug}
                id={`nav-item-${item.slug}`}
                href={`/${categorySlug}/${subCategorySlug}/${item.slug}`}
                className={`flex-shrink-0 px-5 py-1.5 rounded-full border text-[12px] tracking-widest uppercase transition-all duration-200 ${
                  isActive
                    ? "bg-black text-white border-black font-black"
                    : "bg-white text-gray-400 border-gray-100 font-bold hover:border-gray-300 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          aria-label="Scroll categories right"
          onClick={() => scrollNav("right")}
          className={`absolute right-0 top-0 bottom-0 z-10 flex items-center pr-3 pl-6 bg-gradient-to-l from-white via-white/95 to-transparent transition-opacity duration-200 ${canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>
      </div>

      {/* ── Filter + Sort bar ─────────────────── */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-gray-100">
        <div className="px-6 md:px-10 xl:px-16 flex items-center justify-between py-3 gap-4 flex-wrap">
          {/* Filter button */}
          <button
            id="filter-toggle"
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-2 text-[12px] font-black uppercase tracking-widest rounded-full px-4 py-2 border transition-all duration-200 ${
              filterOpen
                ? "bg-black text-white border-black"
                : "bg-white text-black border-gray-200 hover:border-black hover:bg-gray-50"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filter
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-[12px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap hidden sm:block">
              Sort:
            </label>
            <div className="relative">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none text-[12px] font-black uppercase tracking-widest text-black border border-gray-200 rounded-full pl-4 pr-8 py-2 bg-white hover:border-black transition-colors outline-none cursor-pointer"
              >
                <option value="default">Featured</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="new">New Arrivals</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Price range panel */}
        {filterOpen && products.length > 0 && (
          <div className="px-6 md:px-10 xl:px-16 pb-5 pt-1 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Price Range</span>
                  <span className="text-[12px] font-black text-black">
                    ₹{priceRange[0].toLocaleString("en-IN")} – ₹{priceRange[1].toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Dual range slider */}
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
                  {/* Min slider */}
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={100}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v <= priceRange[1] - 100) setPriceRange([v, priceRange[1]]);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ zIndex: priceRange[0] > maxPrice - 200 ? 5 : 3 }}
                  />
                  {/* Max slider */}
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={100}
                    value={priceRange[1]}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v >= priceRange[0] + 100) setPriceRange([priceRange[0], v]);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ zIndex: 4 }}
                  />
                  {/* Visual thumbs */}
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

      {/* ── Product Grid ──────────────────────── */}
      <div className="px-6 md:px-10 xl:px-16 py-10">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm font-black uppercase tracking-widest text-gray-300">No products match your filter</p>
            <button
              onClick={() => setPriceRange([minPrice, maxPrice])}
              className="text-xs font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:opacity-60 transition-opacity"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
              {paginated.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-gray-200 disabled:opacity-30 hover:bg-black hover:text-white transition-colors"
                >
                  Prev
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-8 h-8 flex items-center justify-center text-[11px] font-black transition-colors ${
                        currentPage === i 
                          ? "bg-black text-white" 
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-gray-200 disabled:opacity-30 hover:bg-black hover:text-white transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


