"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, ChevronLeft, ChevronRight, Filter, RotateCcw,
  ClipboardList, TrendingUp, Truck, PackageCheck, XCircle,
  ChevronDown, X, Edit3, Check,
} from "lucide-react";

/* ─── Types ─────────────────────────────────── */

type OrderItem = {
  title: string; colorName: string; size: string; quantity: number; priceAtOrder: number;
};

type Order = {
  _id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: { fullName: string; line1: string; city: string; state: string; pincode: string; mobile: string };
  pricing: { subtotal: number; tax: number; shippingFee: number; total: number; discount: number; couponDiscount: number };
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  timeline: { status: string; message: string; timestamp: string }[];
  createdAt: string;
};

type Stats = {
  totalOrders: number; placed: number; shipped: number;
  delivered: number; cancelled: number; revenue: number;
};

type Meta = { page: number; limit: number; total: number; totalPages: number };

/* ─── Constants ─────────────────────────────── */

const ORDER_STATUSES = ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

const STATUS_STYLES: Record<string, string> = {
  Placed:    'bg-blue-50   text-blue-600   border-blue-100',
  Confirmed: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  Shipped:   'bg-amber-50  text-amber-600  border-amber-100',
  Delivered: 'bg-green-50  text-green-600  border-green-100',
  Cancelled: 'bg-red-50    text-red-500    border-red-100',
  Returned:  'bg-gray-50   text-gray-500   border-gray-200',
};

const PAY_STYLES: Record<string, string> = {
  Paid:     'text-green-600 bg-green-50',
  Pending:  'text-amber-600 bg-amber-50',
  Failed:   'text-red-500   bg-red-50',
  Refunded: 'text-gray-500  bg-gray-100',
};

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/* ─── Stat Card ─────────────────────────────── */

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-sm border p-5 flex flex-col gap-2 ${color}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-2xl font-black">{value}</p>
      {sub && <p className="text-[11px] font-semibold opacity-60">{sub}</p>}
    </div>
  );
}

/* ─── Status Updater ────────────────────────── */

function StatusBadge({ orderId, current, onUpdated }: { orderId: string; current: string; onUpdated: (newStatus: string) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = async (next: string) => {
    if (next === current) { setOpen(false); return; }
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json();
    if (data.success) onUpdated(next);
    setLoading(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border rounded-full transition-opacity ${STATUS_STYLES[current] || 'bg-gray-50 text-gray-500 border-gray-200'} ${loading ? 'opacity-50' : 'hover:opacity-80'}`}
      >
        {loading ? '...' : current}
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-sm shadow-xl min-w-[160px] py-1 overflow-hidden">
            {ORDER_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => update(s)}
                className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors ${s === current ? 'text-black' : 'text-gray-500'}`}
              >
                {s}
                {s === current && <Check size={12} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Detail Drawer ─────────────────────────── */

function OrderDrawer({ order, onClose, onStatusChange }: { order: Order; onClose: () => void; onStatusChange: (id: string, status: string) => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-[560px] bg-white z-50 flex flex-col shadow-2xl overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Details</p>
            <h2 className="text-lg font-black text-black">{order.orderId}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-6 flex flex-col gap-8">

          {/* Status + Date */}
          <div className="flex items-center justify-between">
            <StatusBadge orderId={order._id} current={order.status} onUpdated={(s) => onStatusChange(order._id, s)} />
            <span className="text-[11px] text-gray-400 font-semibold">{fmtDate(order.createdAt)}</span>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Items ({order.items.length})</h3>
            <div className="flex flex-col gap-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start p-4 bg-gray-50 border border-gray-100 rounded-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-black">{item.title}</span>
                    <div className="flex gap-2 text-[11px] text-gray-500 font-semibold uppercase tracking-wide">
                      {item.colorName !== 'Default' && <span>{item.colorName}</span>}
                      {item.size !== 'Default' && <span>Size {item.size}</span>}
                      <span>× {item.quantity}</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-black">{fmt(item.priceAtOrder * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Pricing</h3>
            <div className="bg-gray-50 border border-gray-100 rounded-sm p-4 flex flex-col gap-3 text-[13px]">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal (excl. tax)</span><span className="font-bold">{fmt(order.pricing.total - order.pricing.tax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GST (18%)</span><span className="font-bold">{fmt(order.pricing.tax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="text-green-600 font-black text-[11px] uppercase">Free</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-3 mt-1"><span className="font-black uppercase text-black">Total</span><span className="font-black text-black text-base">{fmt(order.pricing.total)}</span></div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Payment</span>
                <span className={`font-black uppercase px-2 py-0.5 rounded-sm text-[10px] ${PAY_STYLES[order.paymentStatus] || 'text-gray-500 bg-gray-50'}`}>{order.paymentStatus} · {order.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Delivery Address</h3>
            <div className="bg-gray-50 border border-gray-100 rounded-sm p-4 text-[13px] text-gray-600 leading-relaxed">
              <p className="font-bold text-black">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
              <p className="text-gray-400 text-[11px] mt-1">Ph: {order.shippingAddress.mobile}</p>
            </div>
          </div>

          {/* Timeline */}
          {order.timeline?.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Timeline</h3>
              <div className="relative pl-5 flex flex-col gap-5">
                {[...order.timeline].reverse().map((ev, i, arr) => (
                  <div key={i} className="relative flex gap-4">
                    <div className={`absolute -left-5 mt-1 w-2.5 h-2.5 rounded-full border-2 border-white ${i === 0 ? 'bg-black' : 'bg-gray-300'}`} />
                    {i < arr.length - 1 && <div className="absolute -left-[14px] top-3 bottom-[-20px] w-px bg-gray-200" />}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-black">{ev.status}</span>
                      <span className="text-[11px] text-gray-500">{ev.message}</span>
                      <span className="text-[10px] text-gray-400">{new Date(ev.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

/* ─── Main Page ─────────────────────────────── */

function AdminOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);

  // Filter state
  const [search, setSearch]               = useState('');
  const [status, setStatus]               = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [sort, setSort]                   = useState('newest');
  const [page, setPage]                   = useState(1);
  const [limit, setLimit]                 = useState(20);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (search)                  p.set('search', search);
    if (status !== 'all')        p.set('status', status);
    if (paymentStatus !== 'all') p.set('paymentStatus', paymentStatus);
    if (paymentMethod !== 'all') p.set('paymentMethod', paymentMethod);
    p.set('sort',  sort);
    p.set('page',  String(page));
    p.set('limit', String(limit));
    return p.toString();
  }, [search, status, paymentStatus, paymentMethod, sort, page, limit]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?${buildQuery()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setStats(data.stats);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const reset = () => { setSearch(''); setStatus('all'); setPaymentStatus('all'); setPaymentMethod('all'); setSort('newest'); setLimit(20); setPage(1); };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    if (drawerOrder?._id === orderId) setDrawerOrder(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const hasFilters = search || status !== 'all' || paymentStatus !== 'all' || paymentMethod !== 'all' || sort !== 'newest';

  return (
    <div className="min-h-screen bg-[#f8f8f8] p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-black">Orders</h1>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-400 mt-1">
              Manage & track all customer orders
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard label="Total Orders"  value={stats.totalOrders} color="bg-white border-gray-200 text-black" />
            <StatCard label="Placed"        value={stats.placed}      color="bg-blue-50 border-blue-100 text-blue-700" />
            <StatCard label="Shipped"       value={stats.shipped}     color="bg-amber-50 border-amber-100 text-amber-700" />
            <StatCard label="Delivered"     value={stats.delivered}   color="bg-green-50 border-green-100 text-green-700" />
            <StatCard label="Cancelled"     value={stats.cancelled}   color="bg-red-50 border-red-100 text-red-600" />
            <StatCard label="Total Revenue" value={fmt(stats.revenue)} color="bg-black border-black text-white" />
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search order ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-black"
            />
          </div>

          {/* Status */}
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="text-[12px] font-bold uppercase tracking-wider border border-gray-200 px-3 py-2.5 rounded-sm focus:outline-none focus:border-black bg-white text-gray-700 cursor-pointer">
            <option value="all">All Statuses</option>
            {['Placed','Confirmed','Shipped','Delivered','Cancelled','Returned'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Payment Status */}
          <select value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPage(1); }}
            className="text-[12px] font-bold uppercase tracking-wider border border-gray-200 px-3 py-2.5 rounded-sm focus:outline-none focus:border-black bg-white text-gray-700 cursor-pointer">
            <option value="all">All Payments</option>
            {['Paid','Pending','Failed','Refunded'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Method */}
          <select value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setPage(1); }}
            className="text-[12px] font-bold uppercase tracking-wider border border-gray-200 px-3 py-2.5 rounded-sm focus:outline-none focus:border-black bg-white text-gray-700 cursor-pointer">
            <option value="all">All Methods</option>
            {['UPI','Card','COD'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Sort */}
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            className="text-[12px] font-bold uppercase tracking-wider border border-gray-200 px-3 py-2.5 rounded-sm focus:outline-none focus:border-black bg-white text-gray-700 cursor-pointer">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="total_desc">Highest Value</option>
            <option value="total_asc">Lowest Value</option>
          </select>

          {/* Per-page limit */}
          <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
            className="text-[12px] font-bold uppercase tracking-wider border border-gray-200 px-3 py-2.5 rounded-sm focus:outline-none focus:border-black bg-white text-gray-700 cursor-pointer">
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
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_80px_90px_90px_110px_44px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
            {['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', ''].map(h => (
              <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="animate-pulse text-xs font-black uppercase tracking-widest text-gray-300">Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <ClipboardList size={40} className="text-gray-200 mb-4" strokeWidth={1.5} />
              <p className="text-sm font-black uppercase tracking-widest text-gray-300">No orders found</p>
              {hasFilters && <button onClick={reset} className="mt-4 text-xs font-bold uppercase tracking-widest text-black underline underline-offset-4">Clear filters</button>}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map(order => (
                <div
                  key={order._id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_80px_90px_90px_110px_44px] gap-4 items-center px-6 py-4 hover:bg-gray-50/80 transition-colors group"
                >
                  {/* Order ID + Date */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-black">{order.orderId}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{fmtDate(order.createdAt)}</span>
                  </div>

                  {/* Customer */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-black truncate">{order.shippingAddress.fullName}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                  </div>

                  {/* Items */}
                  <span className="text-sm font-bold text-gray-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>

                  {/* Total */}
                  <span className="text-sm font-black text-black">{fmt(order.pricing.total)}</span>

                  {/* Payment */}
                  <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm w-fit ${PAY_STYLES[order.paymentStatus] || 'text-gray-500 bg-gray-50'}`}>
                      {order.paymentStatus}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">{order.paymentMethod}</span>
                  </div>

                  {/* Status Dropdown */}
                  <StatusBadge orderId={order._id} current={order.status} onUpdated={s => handleStatusChange(order._id, s)} />

                  {/* Detail button */}
                  <button
                    onClick={() => setDrawerOrder(order)}
                    className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:border-black hover:text-black transition-all opacity-0 group-hover:opacity-100"
                    title="View details"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-[11px] font-semibold text-gray-400">
                Showing {Math.min((meta.page - 1) * meta.limit + 1, meta.total)}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total} orders
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-2 border border-gray-200 rounded-sm hover:border-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-black px-2">
                  {meta.page} / {meta.totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
                  className="p-2 border border-gray-200 rounded-sm hover:border-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Drawer */}
      {drawerOrder && (
        <OrderDrawer
          order={drawerOrder}
          onClose={() => setDrawerOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrdersContent />
    </Suspense>
  );
}
