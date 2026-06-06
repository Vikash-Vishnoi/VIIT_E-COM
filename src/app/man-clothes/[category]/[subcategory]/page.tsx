"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */

type SubItem = { label: string; slug: string };

const categoryMap: Record<string, { title: string; items: SubItem[] }> = {
  denim: {
    title: "Denim",
    items: [
      { label: "Denim Jacket", slug: "denim-jacket" },
      { label: "Denim Jeans", slug: "denim-jeans" },
    ],
  },
  man: {
    title: "Man",
    items: [
      { label: "Jeans", slug: "jeans" },
      { label: "Linen", slug: "linen" },
    ],
  },
};

const subcategoryLabelMap: Record<string, string> = {
  "denim-jacket": "Denim Jacket",
  "denim-jeans": "Denim Jeans",
  jeans: "Jeans",
  linen: "Linen",
};

/* ─── Mock products ──────────────────────────────────────── */

type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  badge?: string;
};

function getProducts(subcategory: string): Product[] {
  const base: Record<string, Product[]> = {
    "denim-jacket": [
      { id: 1, name: "Classic Indigo Denim Jacket", price: 2899, image: "/images/man-header.jpeg", badge: "New" },
      { id: 2, name: "Washed Trucker Jacket", price: 3499, image: "/images/man-header.jpeg" },
      { id: 3, name: "Dark Rinse Slim Jacket", price: 3199, image: "/images/man-header.jpeg", badge: "Sale" },
      { id: 4, name: "Distressed Heritage Jacket", price: 3799, image: "/images/man-header.jpeg" },
      { id: 5, name: "Oversized Boxy Denim", price: 4199, image: "/images/man-header.jpeg", badge: "New" },
      { id: 6, name: "Raw Edge Denim Jacket", price: 2699, image: "/images/man-header.jpeg" },
      { id: 7, name: "Acid Wash Jacket", price: 3099, image: "/images/man-header.jpeg" },
      { id: 8, name: "Sherpa-Lined Denim", price: 4599, image: "/images/man-header.jpeg", badge: "New" },
    ],
    "denim-jeans": [
      { id: 1, name: "Slim Fit Indigo Jeans", price: 2199, image: "/images/man-header.jpeg", badge: "New" },
      { id: 2, name: "Straight Cut Raw Denim", price: 2599, image: "/images/man-header.jpeg" },
      { id: 3, name: "Tapered Dark Wash", price: 2399, image: "/images/man-header.jpeg" },
      { id: 4, name: "Relaxed Fit Vintage Blue", price: 2799, image: "/images/man-header.jpeg", badge: "Sale" },
      { id: 5, name: "Skinny Stretch Jeans", price: 1999, image: "/images/man-header.jpeg" },
      { id: 6, name: "Baggy Low Rise Denim", price: 2999, image: "/images/man-header.jpeg", badge: "New" },
    ],
    jeans: [
      { id: 1, name: "Classic Fit Chinos", price: 1899, image: "/images/man-header.jpeg" },
      { id: 2, name: "Slim Cargo Pants", price: 2299, image: "/images/man-header.jpeg", badge: "New" },
      { id: 3, name: "Jogger Trousers", price: 1799, image: "/images/man-header.jpeg" },
      { id: 4, name: "Pleated Wide Leg", price: 2699, image: "/images/man-header.jpeg" },
      { id: 5, name: "Utility Pants", price: 2499, image: "/images/man-header.jpeg", badge: "Sale" },
    ],
    linen: [
      { id: 1, name: "Linen Relaxed Trousers", price: 2099, image: "/images/man-header.jpeg", badge: "New" },
      { id: 2, name: "Linen Shorts", price: 1599, image: "/images/man-header.jpeg" },
      { id: 3, name: "Linen Shirt Pants Set", price: 3499, image: "/images/man-header.jpeg" },
      { id: 4, name: "Drawstring Linen Pants", price: 1899, image: "/images/man-header.jpeg", badge: "New" },
    ],
  };
  return base[subcategory] ?? base["denim-jacket"];
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

export default function SubcategoryPage() {
  const params = useParams();
  const category = (params.category as string) ?? "denim";
  const subcategory = (params.subcategory as string) ?? "denim-jacket";

  const categoryData = categoryMap[category] ?? categoryMap["denim"];
  const subcategoryLabel = subcategoryLabelMap[subcategory] ?? subcategory;

  /* scroll arrows */
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
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

  /* filter & sort */
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "new">("default");

  const allProducts = getProducts(subcategory);
  const minPrice = Math.min(...allProducts.map((p) => p.price));
  const maxPrice = Math.max(...allProducts.map((p) => p.price));
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);

  /* reset range when subcategory changes */
  useEffect(() => {
    const prods = getProducts(subcategory);
    const mn = Math.min(...prods.map((p) => p.price));
    const mx = Math.max(...prods.map((p) => p.price));
    setPriceRange([mn, mx]);
  }, [subcategory]);

  const filtered = allProducts
    .filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "new") return (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0);
      return 0;
    });

  /* all nav items (current category first) */
  const currentItems = categoryData?.items ?? [];
  const otherItems = Object.entries(categoryMap)
    .filter(([key]) => key !== category)
    .flatMap(([key, cat]) => cat.items.map((item) => ({ ...item, catKey: key })));

  return (
    <div className="min-h-screen bg-white">

      {/* ── Breadcrumb ────────────────────────── */}
      <div className="px-6 md:px-10 xl:px-16 pt-8 pb-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/man-clothes" className="hover:text-black transition-colors">Man</Link>
          <span className="text-gray-300">/</span>
          <span className="text-black font-bold">{subcategoryLabel}</span>
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
          {currentItems.map((item) => {
            const isActive = item.slug === subcategory;
            return (
              <Link
                key={item.slug}
                href={`/man-clothes/${category}/${item.slug}`}
                className={`flex-shrink-0 px-5 py-1.5 rounded-full border text-[12px] tracking-widest uppercase transition-all duration-200 ${
                  isActive
                    ? "bg-black text-white border-black font-black"
                    : "bg-white text-black border-gray-300 font-bold hover:border-black hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Divider */}
          {otherItems.length > 0 && (
            <span className="flex-shrink-0 w-px h-5 bg-gray-200 mx-1" />
          )}

          {otherItems.map((item) => (
            <Link
              key={`${item.catKey}-${item.slug}`}
              href={`/man-clothes/${item.catKey}/${item.slug}`}
              className="flex-shrink-0 px-5 py-1.5 rounded-full border text-[12px] tracking-widest uppercase font-bold bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:text-black transition-all duration-200"
            >
              {item.label}
            </Link>
          ))}
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
        {filterOpen && (
          <div className="px-6 md:px-10 xl:px-16 pb-5 pt-1 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Price Range</span>
                  <span className="text-[12px] font-black text-black">
                    ₹{priceRange[0].toLocaleString("en-IN")} – ₹{priceRange[1].toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Dual range slider (visual only, single thumb for simplicity) */}
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
                    id="price-min"
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
                    id="price-max"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Product card
───────────────────────────────────────────── */

function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="group flex flex-col cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 rounded-sm mb-3">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-500 ${hovered ? "scale-105" : "scale-100"}`}
        />

        {product.badge && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full ${
              product.badge === "Sale" ? "bg-red-500 text-white" : "bg-black text-white"
            }`}
          >
            {product.badge}
          </span>
        )}

        {/* Quick add */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-black/90 text-white text-[11px] font-black uppercase tracking-widest text-center py-3 transition-transform duration-300 ${
            hovered ? "translate-y-0" : "translate-y-full"
          }`}
        >
          + Quick Add
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-black leading-snug line-clamp-2 group-hover:underline underline-offset-2 transition-all">
          {product.name}
        </h2>
        <p className="text-[13px] font-semibold text-gray-500">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
      </div>
    </article>
  );
}
