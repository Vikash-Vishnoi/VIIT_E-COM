"use client";

import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  UserPlus,
  AlertTriangle,
  PlusCircle,
  ClipboardList,
  Ticket,
  FolderTree,
  ArrowRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Mock data — will be replaced by API calls later
───────────────────────────────────────────── */

const stats = [
  { label: "Total Revenue",  value: "₹4,82,350",  change: "+12.5%",       positive: true,  icon: <IndianRupee size={22} strokeWidth={1.6} /> },
  { label: "Total Orders",   value: "186",         change: "+8.2%",        positive: true,  icon: <ShoppingBag size={22} strokeWidth={1.6} /> },
  { label: "New Users",      value: "42",          change: "+23.1%",       positive: true,  icon: <UserPlus size={22} strokeWidth={1.6} /> },
  { label: "Low Stock",      value: "7",           change: "SKUs below 5", positive: false, icon: <AlertTriangle size={22} strokeWidth={1.6} /> },
];

const recentOrders = [
  { orderId: "VIIT-2026-00421", customer: "Rahul S.",  items: 3, total: "₹8,697",  status: "Delivered",  date: "5 Jun 2026" },
  { orderId: "VIIT-2026-00420", customer: "Priya M.",  items: 1, total: "₹2,899",  status: "Shipped",    date: "5 Jun 2026" },
  { orderId: "VIIT-2026-00419", customer: "Aditya K.", items: 2, total: "₹5,198",  status: "Confirmed",  date: "4 Jun 2026" },
  { orderId: "VIIT-2026-00418", customer: "Sneha R.",  items: 4, total: "₹12,396", status: "Placed",     date: "4 Jun 2026" },
  { orderId: "VIIT-2026-00417", customer: "Vikram J.", items: 1, total: "₹3,499",  status: "Cancelled",  date: "3 Jun 2026" },
];

const lowStockItems = [
  { product: "Classic Indigo Denim Jacket", sku: "VIIT-DJ-IND-M",  color: "Indigo", size: "M",  qty: 2 },
  { product: "Slim Fit Indigo Jeans",       sku: "VIIT-JN-IND-L",  color: "Indigo", size: "L",  qty: 1 },
  { product: "Linen Relaxed Trousers",      sku: "VIIT-LN-WH-XL",  color: "White",  size: "XL", qty: 3 },
  { product: "Washed Trucker Jacket",       sku: "VIIT-TJ-BL-S",   color: "Blue",   size: "S",  qty: 0 },
  { product: "Sherpa-Lined Denim",          sku: "VIIT-SH-DK-M",   color: "Dark",   size: "M",  qty: 4 },
];

const quickActions = [
  { label: "Add Product",       href: "/admin/products/new", description: "Create a new product listing", icon: <PlusCircle size={20} strokeWidth={1.6} /> },
  { label: "View Orders",       href: "/admin/orders",       description: "Manage recent orders",         icon: <ClipboardList size={20} strokeWidth={1.6} /> },
  { label: "Create Coupon",     href: "/admin/coupons",      description: "Launch a new promotion",       icon: <Ticket size={20} strokeWidth={1.6} /> },
  { label: "Manage Categories", href: "/admin/categories",   description: "Edit nav structure",           icon: <FolderTree size={20} strokeWidth={1.6} /> },
];

/* Status badge helper */
function statusColor(status: string) {
  switch (status) {
    case "Delivered": return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "Shipped":   return "bg-blue-50 text-blue-600 border-blue-200";
    case "Confirmed": return "bg-amber-50 text-amber-600 border-amber-200";
    case "Placed":    return "bg-gray-100 text-gray-500 border-gray-200";
    case "Cancelled": return "bg-red-50 text-red-500 border-red-200";
    case "Returned":  return "bg-purple-50 text-purple-500 border-purple-200";
    default:          return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

/* ─────────────────────────────────────────────
   Dashboard Page
───────────────────────────────────────────── */

export default function AdminDashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto">

      {/* ── Welcome header ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Welcome back
          </h2>
          <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mt-0.5">
            Here&apos;s what&apos;s happening with your store today
          </p>
        </div>
        <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
        </p>
      </div>

      {/* ── Stats Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200/60 p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-gray-300/60 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {stat.label}
              </span>
              <span className="text-gray-300">{stat.icon}</span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl font-black text-black tracking-tight">
                {stat.value}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid: Recent Orders + Low Stock ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Orders — takes 2 cols */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-black">
              Recent Orders
            </h3>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            >
              View All <ArrowRight size={12} strokeWidth={2} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 px-5 py-2.5">Order</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 px-5 py-2.5">Customer</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-5 py-2.5">Items</th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-gray-400 px-5 py-2.5">Total</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-5 py-2.5">Status</th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-gray-400 px-5 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.orderId} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-5 py-3"><span className="text-[12px] font-bold text-black font-mono">{order.orderId}</span></td>
                    <td className="px-5 py-3"><span className="text-[12px] font-semibold text-gray-600">{order.customer}</span></td>
                    <td className="px-5 py-3 text-center"><span className="text-[12px] font-semibold text-gray-500">{order.items}</span></td>
                    <td className="px-5 py-3 text-right"><span className="text-[12px] font-bold text-black">{order.total}</span></td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right"><span className="text-[11px] font-medium text-gray-400">{order.date}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts — 1 col */}
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-black flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Low Stock
            </h3>
            <Link
              href="/admin/inventory"
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            >
              Inventory <ArrowRight size={12} strokeWidth={2} />
            </Link>
          </div>
          <div className="flex-1 divide-y divide-gray-50 overflow-y-auto max-h-[400px]">
            {lowStockItems.map((item) => (
              <div key={item.sku} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-black truncate leading-tight">{item.product}</p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5 tracking-wider">
                      {item.color} · {item.size} · <span className="font-mono">{item.sku}</span>
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.qty === 0 ? "bg-red-50 text-red-500 border border-red-200" : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}
                  >
                    {item.qty === 0 ? "OUT" : `${item.qty} left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────── */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-white rounded-xl border border-gray-200/60 p-4 flex items-start gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-black/10 transition-all duration-200"
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-200">
                {action.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-black uppercase tracking-wider text-black group-hover:underline underline-offset-2">{action.label}</p>
                <p className="text-[10px] font-medium text-gray-400 mt-0.5 tracking-wider">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Order Status Breakdown ───────────────── */}
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-black">Order Status Breakdown</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Placed",    count: 24, color: "bg-gray-100 text-gray-500" },
              { label: "Confirmed", count: 18, color: "bg-amber-50 text-amber-600" },
              { label: "Shipped",   count: 42, color: "bg-blue-50 text-blue-600" },
              { label: "Delivered", count: 89, color: "bg-emerald-50 text-emerald-600" },
              { label: "Cancelled", count: 8,  color: "bg-red-50 text-red-500" },
              { label: "Returned",  count: 5,  color: "bg-purple-50 text-purple-500" },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
                <p className="text-xl font-black">{s.count}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
