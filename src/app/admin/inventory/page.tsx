"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight, RotateCcw, Box, AlertTriangle, XCircle, Check } from "lucide-react";

/* ─── Types ─────────────────────────────────── */

type InventoryItem = {
  _id: string;
  productId: string;
  title: string;
  category: string;
  image?: string;
  colorName: string;
  size: string;
  sku: string;
  quantity: number;
};

type Stats = {
  totalSkus: number;
  lowStock: number;
  outOfStock: number;
};

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/* ─── Stat Card ─────────────────────────────── */

function StatCard({ label, value, icon: Icon, colorClass }: { label: string; value: number; icon: any; colorClass: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-2xl font-black text-black">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
    </div>
  );
}

/* ─── Inline Editable Quantity ──────────────── */

function EditableQuantity({
  initialQty,
  productId,
  sku,
  onSaved
}: {
  initialQty: number;
  productId: string;
  sku: string;
  onSaved: (sku: string, newQty: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(initialQty.toString());
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) {
      setVal(initialQty.toString());
      setIsEditing(false);
      return;
    }

    if (num === initialQty) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, sku, newQuantity: num })
      });
      const data = await res.json();
      if (data.success) {
        onSaved(sku, num);
      } else {
        alert(data.message || 'Failed to update stock');
        setVal(initialQty.toString());
      }
    } catch (err) {
      alert('Network error');
      setVal(initialQty.toString());
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          value={val}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          onChange={e => setVal(e.target.value)}
          className="w-16 px-2 py-1 text-sm border border-black rounded-sm focus:outline-none"
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') { setVal(initialQty.toString()); setIsEditing(false); }
          }}
          disabled={loading}
        />
        <button onClick={save} disabled={loading} className="p-1.5 bg-black text-white rounded-sm hover:bg-gray-800 disabled:opacity-50">
          <Check size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 px-3 py-1.5 border border-transparent hover:border-gray-200 rounded-sm group transition-colors"
      title="Click to edit"
    >
      <span className="text-sm font-black text-black">{initialQty}</span>
      <span className="text-[10px] uppercase font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
    </button>
  );
}

/* ─── Main Content ──────────────────────────── */

function AdminInventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set('search', debouncedSearch);
    if (status !== 'all') p.set('status', status);
    p.set('page', String(page));
    p.set('limit', String(limit));
    return p.toString();
  }, [debouncedSearch, status, page, limit]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory?${buildQuery()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
        setStats(data.stats);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleStockSaved = (sku: string, newQty: number) => {
    setItems(prev => prev.map(item => item.sku === sku ? { ...item, quantity: newQty } : item));
    // Optionally refetch stats, but letting it slide for UX speed
  };

  const reset = () => {
    setSearch('');
    setStatus('all');
    setLimit(20);
    setPage(1);
  };

  const hasFilters = search || status !== 'all';

  return (
    <div className="min-h-screen bg-[#f8f8f8] p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-black">Inventory Management</h1>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-400 mt-1">
            Track and adjust stock levels across all SKUs
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total SKUs" value={stats.totalSkus} icon={Box} colorClass="bg-blue-50 text-blue-600" />
            <StatCard label="Low Stock (<10)" value={stats.lowStock} icon={AlertTriangle} colorClass="bg-amber-50 text-amber-600" />
            <StatCard label="Out of Stock" value={stats.outOfStock} icon={XCircle} colorClass="bg-red-50 text-red-600" />
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex flex-wrap items-end gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU or Product Name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-black"
            />
          </div>

          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="text-[12px] font-bold uppercase tracking-wider border border-gray-200 px-3 py-2.5 rounded-sm focus:outline-none focus:border-black bg-white text-gray-700 cursor-pointer"
          >
            <option value="all">All Stock Status</option>
            <option value="low_stock">Low Stock (≤10)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          <select
            value={limit}
            onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
            className="text-[12px] font-bold uppercase tracking-wider border border-gray-200 px-3 py-2.5 rounded-sm focus:outline-none focus:border-black bg-white text-gray-700 cursor-pointer"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          {hasFilters && (
            <button onClick={reset} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-400 hover:text-black transition-colors px-3 py-2.5 border border-gray-200 rounded-sm hover:border-black">
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_200px_150px_150px_120px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
            {['Product', 'SKU', 'Variant', 'Status', 'Stock Level'].map(h => (
              <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</span>
            ))}
          </div>

          {loading ? (
             <div className="flex items-center justify-center py-32">
               <div className="animate-pulse text-xs font-black uppercase tracking-widest text-gray-300">Loading inventory...</div>
             </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Box size={40} className="text-gray-200 mb-4" strokeWidth={1.5} />
              <p className="text-sm font-black uppercase tracking-widest text-gray-300">No SKUs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(item => (
                <div key={item.sku} className="grid grid-cols-1 md:grid-cols-[1fr_200px_150px_150px_120px] gap-4 items-center px-6 py-4 hover:bg-gray-50/80 transition-colors">
                  
                  {/* Product */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 relative bg-gray-100 rounded-sm overflow-hidden shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Box size={16} /></div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-bold text-black truncate">{item.title}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.category}</span>
                    </div>
                  </div>

                  {/* SKU */}
                  <span className="text-sm font-mono text-gray-600 font-bold">{item.sku}</span>

                  {/* Variant */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black">{item.colorName}</span>
                    <span className="text-[11px] text-gray-500 font-semibold">Size: {item.size}</span>
                  </div>

                  {/* Status */}
                  <div>
                    {item.quantity === 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider">
                        <XCircle size={10} /> Out of Stock
                      </span>
                    ) : item.quantity <= 10 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider">
                        <AlertTriangle size={10} /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider">
                        <Check size={10} strokeWidth={3} /> In Stock
                      </span>
                    )}
                  </div>

                  {/* Stock Level (Editable) */}
                  <div className="flex justify-start">
                    <EditableQuantity
                      initialQty={item.quantity}
                      productId={item.productId}
                      sku={item.sku}
                      onSaved={handleStockSaved}
                    />
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-[11px] font-semibold text-gray-400">
                Showing {Math.min((meta.page - 1) * meta.limit + 1, meta.total)}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total} SKUs
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-2 border border-gray-200 rounded-sm hover:border-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-black px-2">{meta.page} / {meta.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
                  className="p-2 border border-gray-200 rounded-sm hover:border-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense>
      <AdminInventoryContent />
    </Suspense>
  );
}
