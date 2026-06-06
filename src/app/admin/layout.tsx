"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Star,
  Ticket,
  FolderTree,
  Warehouse,
  ChevronsLeft,
  ExternalLink,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Sidebar nav items — using lucide-react icons
───────────────────────────────────────────── */

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard",  href: "/admin",           icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
  { label: "Products",   href: "/admin/products",  icon: <Package size={18} strokeWidth={1.8} /> },
  { label: "Orders",     href: "/admin/orders",    icon: <ClipboardList size={18} strokeWidth={1.8} /> },
  { label: "Users",      href: "/admin/users",     icon: <Users size={18} strokeWidth={1.8} /> },
  { label: "Reviews",    href: "/admin/reviews",   icon: <Star size={18} strokeWidth={1.8} /> },
  { label: "Coupons",    href: "/admin/coupons",   icon: <Ticket size={18} strokeWidth={1.8} /> },
  { label: "Categories", href: "/admin/categories",icon: <FolderTree size={18} strokeWidth={1.8} /> },
  { label: "Inventory",  href: "/admin/inventory", icon: <Warehouse size={18} strokeWidth={1.8} /> },
];

/* ─────────────────────────────────────────────
   Admin Layout — sidebar + content
   Sits inside root layout (Header + Footer)
───────────────────────────────────────────── */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)]">

      {/* ── Mobile overlay ───────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside
        className={`
          fixed lg:sticky lg:top-20 inset-y-0 left-0 z-50 lg:z-30
          flex flex-col
          bg-[#0a0a0a] text-white
          border-r border-white/5
          transition-all duration-300 ease-in-out
          h-screen lg:h-[calc(100vh-80px)]
          ${collapsed ? "w-[68px]" : "w-[240px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className={`flex items-center h-14 px-5 border-b border-white/5 flex-shrink-0 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-black text-[10px] font-black tracking-tight">V</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[12px] font-black tracking-wider uppercase">VIIT Admin</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2.5 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center gap-2.5 rounded-lg transition-all duration-150
                  ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"}
                  ${active
                    ? "bg-white text-black shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className={`text-[11px] font-bold tracking-wider uppercase truncate ${active ? "text-black" : ""}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-white/5 p-2.5 space-y-0.5 flex-shrink-0">
          {/* Visit Store link */}
          <Link
            href="/"
            target="_blank"
            title={collapsed ? "Visit Store" : undefined}
            className={`
              flex items-center gap-2.5 rounded-lg py-2 transition-all
              text-white/30 hover:text-white/60 hover:bg-white/5
              ${collapsed ? "justify-center px-0" : "px-3"}
            `}
          >
            <ExternalLink size={15} strokeWidth={1.8} />
            {!collapsed && (
              <span className="text-[10px] font-bold tracking-wider uppercase">Visit Store</span>
            )}
          </Link>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`
              w-full flex items-center gap-2.5 rounded-lg py-2 transition-all
              text-white/30 hover:text-white/60 hover:bg-white/5
              ${collapsed ? "justify-center px-0" : "px-3"}
            `}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronsLeft
              size={15}
              strokeWidth={1.8}
              className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
            {!collapsed && (
              <span className="text-[10px] font-bold tracking-wider uppercase">Collapse</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Content area ─────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-[#f5f5f7]">

        {/* Mobile topbar (just hamburger + title) */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200/60">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
            aria-label="Open admin menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <span className="text-[12px] font-black uppercase tracking-widest text-black">
            {navItems.find((item) => isActive(item.href))?.label ?? "Admin"}
          </span>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
