"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash2,
  Pencil,
  X,
  AlertTriangle,
  Package,
  RotateCcw,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

type ProductColor = {
  colorName: string;
  images: { url: string; order: number }[];
  sizes: { size: string; quantity: number; sku: string }[];
};

type Product = {
  _id: string;
  productId?: string;
  category: string;
  subCategory: string;
  subSubCategory?: string;
  title: string;
  slug: string;
  price: number;
  sellingPrice: number;
  colors: ProductColor[];
  badge: string | null;
  isFeatured: boolean;
  isActive: boolean;
  ratings: { average: number; count: number };
  createdAt: string;
};

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Filters = {
  search: string;
  category: string;
  status: string;
  badge: string;
  featured: string;
  stock: string;
  sort: string;
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function getTotalStock(colors: ProductColor[]): number {
  return colors.reduce(
    (sum, c) => sum + c.sizes.reduce((s, sz) => s + sz.quantity, 0),
    0
  );
}

function getThumbnail(colors: ProductColor[]): string | null {
  if (!colors.length) return null;
  const sorted = [...(colors[0].images || [])].sort((a, b) => a.order - b.order);
  return sorted[0]?.url || null;
}

function formatPrice(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

function badgeColor(badge: string): string {
  switch (badge) {
    case "New":         return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "Sale":        return "bg-red-50 text-red-500 border-red-200";
    case "Best Seller": return "bg-amber-50 text-amber-600 border-amber-200";
    case "Limited":     return "bg-purple-50 text-purple-500 border-purple-200";
    default:            return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

function AdminProductsContent() {
  const searchParams = useSearchParams();

  // ── Initialize from URL on mount ───────────
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    status: searchParams.get("status") || "",
    badge: searchParams.get("badge") || "",
    featured: searchParams.get("featured") || "",
    stock: searchParams.get("stock") || "",
    sort: searchParams.get("sort") || "newest",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [deleting, setDeleting] = useState(false);

  // ── Debounce search ────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // ── BUG FIX #1: Reset page to 1 when any filter changes ──
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [debouncedSearch, filters.category, filters.status, filters.badge, filters.featured, filters.stock, filters.sort]);

  // ── Sync state → browser URL bar (always) ──
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    if (filters.badge) params.set("badge", filters.badge);
    if (filters.featured) params.set("featured", filters.featured);
    if (filters.stock) params.set("stock", filters.stock);
    params.set("sort", filters.sort);

    // Use history API directly — avoids the extra _rsc request that router.replace triggers
    window.history.replaceState(null, "", `/admin/products?${params.toString()}`);
  }, [currentPage, debouncedSearch, filters.category, filters.status, filters.badge, filters.featured, filters.stock, filters.sort]);

  // ── Retry trigger ──────────────────────────
  const [retryCount, setRetryCount] = useState(0);
  const retry = () => setRetryCount((c) => c + 1);

  // ── BUG FIX #2: Single useEffect with AbortController ──
  //    Cancels stale requests when filters change rapidly
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    if (filters.badge) params.set("badge", filters.badge);
    if (filters.featured) params.set("featured", filters.featured);
    if (filters.stock) params.set("stock", filters.stock);
    if (filters.sort) params.set("sort", filters.sort);

    fetch(`/api/admin/products?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.success) {
          setProducts(json.data);
          setMeta(json.meta);
        } else {
          setError(json.message || "Failed to load products");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch products:", err);
          setError(err.message || "Failed to load products");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, filters.category, filters.status, filters.badge, filters.featured, filters.stock, filters.sort, retryCount]);

  // ── Manual page change (pagination clicks) ──
  const goToPage = (page: number) => setCurrentPage(page);

  // ── Inline toggle (isActive / isFeatured) ──
  const toggleField = async (id: string, field: "isActive" | "isFeatured", current: boolean) => {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, [field]: !current } : p))
    );
    try {
      const res = await fetch(`/api/admin/products/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });
      if (!res.ok) {
        // Revert on failure
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, [field]: current } : p))
        );
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, [field]: current } : p))
      );
    }
  };

  // ── Delete product ─────────────────────────
  const handleDelete = async () => {
    if (!deleteModal.product) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteModal.product._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== deleteModal.product!._id));
        setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, product: null });
    }
  };

  // ── Clear filters ──────────────────────────
  const clearFilters = () => {
    setFilters({ search: "", category: "", status: "", badge: "", featured: "", stock: "", sort: "newest" });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.category || filters.status || filters.badge || filters.featured || filters.stock;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">

      {/* ── Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-black">
            Products
          </h2>
          <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mt-0.5">
            {meta.total} product{meta.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={2} />
          Add Product
        </Link>
      </div>

      {/* ── Search + Filter Bar ────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">

        {/* Search row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={16} strokeWidth={2} className="text-gray-300 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by title, slug, or SKU..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="flex-1 text-[13px] font-medium text-black outline-none bg-transparent"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((f) => ({ ...f, search: "" }))}
              className="p-1 rounded text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-3">
            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="MAN">Man</option>
              <option value="WOMAN">Woman</option>
              <option value="KIDS">Kids</option>
              <option value="ACCESSORIES">Accessories</option>
            </select>

            {/* Badge */}
            <select
              value={filters.badge}
              onChange={(e) => setFilters((f) => ({ ...f, badge: e.target.value }))}
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 outline-none cursor-pointer"
            >
              <option value="">All Badges</option>
              <option value="New">New</option>
              <option value="Sale">Sale</option>
              <option value="Best Seller">Best Seller</option>
              <option value="Limited">Limited</option>
            </select>
            
            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 outline-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Featured */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.featured === "true"}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, featured: e.target.checked ? "true" : "" }))
                }
                className="w-3.5 h-3.5 accent-black rounded"
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Featured Only
              </span>
            </label>

            {/* Stock Checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.stock === "has_out_of_stock_variants"}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, stock: e.target.checked ? "has_out_of_stock_variants" : "" }))
                }
                className="w-3.5 h-3.5 accent-black rounded"
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Out of Stock
              </span>
            </label>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 outline-none cursor-pointer ml-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="title_asc">Title: A → Z</option>
              <option value="title_desc">Title: Z → A</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
              >
                <RotateCcw size={11} strokeWidth={2} />
                Clear
              </button>
            )}
          </div>
      </div>

      {/* ── Products Table ─────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">

        {loading ? (
          /* Loading skeleton */
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                  <div className="h-2.5 w-32 bg-gray-50 rounded" />
                </div>
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-3 w-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error state */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <AlertTriangle size={48} strokeWidth={1} className="text-red-300 mb-4" />
            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">
              Failed to load products
            </p>
            <p className="text-[11px] font-medium text-gray-300 mt-1 tracking-wider max-w-xs text-center">
              {error}
            </p>
            <button
              onClick={retry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RotateCcw size={13} strokeWidth={2} />
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Package size={48} strokeWidth={1} className="text-gray-200 mb-4" />
            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">
              No products found
            </p>
            <p className="text-[11px] font-medium text-gray-300 mt-1 tracking-wider">
              {hasActiveFilters ? "Try adjusting your filters" : "Add your first product to get started"}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 text-[11px] font-bold uppercase tracking-widest text-black underline underline-offset-2 hover:no-underline"
              >
                Clear all filters
              </button>
            ) : (
              <Link
                href="/admin/products/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus size={13} strokeWidth={2} />
                Add Product
              </Link>
            )}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 pl-5 pr-2 py-2.5 w-14">
                    {/* Thumbnail */}
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Product ID
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Product
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Category
                  </th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Price
                  </th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Stock
                  </th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Status
                  </th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Featured
                  </th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 pr-5 py-2.5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const thumb = getThumbnail(product.colors);
                  const stock = getTotalStock(product.colors);
                  const hasOutOfStockVariant = product.colors.some((c) => c.sizes.some((sz) => sz.quantity === 0));

                  return (
                    <tr
                      key={product._id}
                      className={`border-t transition-colors group ${
                        hasOutOfStockVariant
                          ? "border-red-300 bg-red-100 hover:bg-red-200"
                          : "border-gray-50 hover:bg-gray-50/50"
                      }`}
                    >
                      {/* Thumbnail */}
                      <td className="pl-5 pr-2 py-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide broken image, show fallback icon
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center text-gray-300 absolute inset-0 ${thumb ? "hidden" : ""}`}>
                            <Package size={18} strokeWidth={1.5} />
                          </div>
                        </div>
                      </td>

                      {/* Product ID */}
                      <td className="px-3 py-3 text-[11px] font-black font-mono text-gray-500 uppercase tracking-widest">
                        {product.productId || "N/A"}
                      </td>

                      {/* Title + slug + badge */}
                      <td className="px-3 py-3 max-w-[260px]">
                        <Link
                          href={`/admin/products/${product._id}`}
                          className="block group/title"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-[12px] font-bold text-black truncate group-hover/title:underline underline-offset-2">
                              {product.title}
                            </p>
                            {product.badge && (
                              <span className={`flex-shrink-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${badgeColor(product.badge)}`}>
                                {product.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-medium text-gray-400 mt-0.5 truncate font-mono">
                            /{product.slug}
                          </p>
                        </Link>
                      </td>

                      {/* Category path */}
                      <td className="px-3 py-3">
                        <p className="text-[11px] font-semibold text-gray-600">
                          {product.category}
                        </p>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                          {[product.subCategory, product.subSubCategory].filter(Boolean).join(" › ")}
                        </p>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3 text-right">
                        <p className="text-[12px] font-bold text-black">
                          {formatPrice(product.sellingPrice)}
                        </p>
                        {product.price !== product.sellingPrice && (
                          <p className="text-[10px] font-medium text-gray-400 line-through mt-0.5">
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-3 py-3 min-w-[200px]">
                        <div className="flex flex-col gap-1.5">
                          {product.colors.map((color) => (
                            <div key={color.colorName} className="text-[11px] font-medium leading-relaxed flex flex-wrap items-center">
                              <span className="text-gray-500 font-semibold mr-1.5">{color.colorName} :</span>
                              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                {color.sizes.map((sz, i) => (
                                  <span key={sz.size} className="flex items-center">
                                    <span className="text-gray-400">{sz.size}-</span>
                                    <span className={`font-bold ml-0.5 ${sz.quantity === 0 ? "text-red-500" : "text-gray-700"}`}>
                                      {sz.quantity}
                                    </span>
                                    {i < color.sizes.length - 1 && <span className="text-gray-300 mx-1.5">|</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Active toggle */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleField(product._id, "isActive", product.isActive)}
                          className="inline-flex items-center gap-1.5 cursor-pointer group/toggle"
                          title={product.isActive ? "Click to deactivate" : "Click to activate"}
                        >
                          <span
                            className={`w-7 h-4 rounded-full relative transition-colors duration-200 ${
                              product.isActive ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${
                                product.isActive ? "left-3.5" : "left-0.5"
                              }`}
                            />
                          </span>
                        </button>
                      </td>

                      {/* Featured toggle */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleField(product._id, "isFeatured", product.isFeatured)}
                          className="cursor-pointer mx-auto"
                          title={product.isFeatured ? "Remove from featured" : "Mark as featured"}
                        >
                          <Star
                            size={16}
                            strokeWidth={1.8}
                            className={`transition-colors duration-150 ${
                              product.isFeatured
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300 hover:text-amber-300"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-3 pr-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${product._id}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} strokeWidth={1.8} />
                          </Link>
                          <button
                            onClick={() => setDeleteModal({ open: true, product })}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} strokeWidth={1.8} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────── */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-gray-400 tracking-wider">
            Showing{" "}
            <span className="text-gray-600">{(meta.page - 1) * meta.limit + 1}</span>
            –
            <span className="text-gray-600">{Math.min(meta.page * meta.limit, meta.total)}</span>
            {" "}of{" "}
            <span className="text-gray-600">{meta.total}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
              className="p-2 rounded-lg text-gray-400 hover:text-black hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>

            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (meta.totalPages <= 7) return true;
                if (p === 1 || p === meta.totalPages) return true;
                if (Math.abs(p - meta.page) <= 1) return true;
                return false;
              })
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dot-${i}`} className="px-1 text-[11px] text-gray-300">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`min-w-[32px] h-8 rounded-lg text-[11px] font-bold transition-colors ${
                      meta.page === p
                        ? "bg-black text-white"
                        : "text-gray-500 hover:bg-white hover:text-black"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => goToPage(meta.page + 1)}
              className="p-2 rounded-lg text-gray-400 hover:text-black hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────── */}
      {deleteModal.open && deleteModal.product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteModal({ open: false, product: null })}
          />
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} strokeWidth={1.8} className="text-red-500" />
            </div>

            {/* Text */}
            <div className="text-center">
              <h3 className="text-[14px] font-black uppercase tracking-wider text-black">
                Delete Product
              </h3>
              <p className="text-[12px] font-medium text-gray-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-bold text-black">&ldquo;{deleteModal.product.title}&rdquo;</span>?
                This action cannot be undone.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                disabled={deleting}
                onClick={() => setDeleteModal({ open: false, product: null })}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} strokeWidth={2} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Interface...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
