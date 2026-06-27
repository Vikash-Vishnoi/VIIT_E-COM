"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  X,
  AlertTriangle,
  Users as UsersIcon,
  Filter,
  RotateCcw,
  UserCheck,
  UserX,
  Mail,
  Phone,
  ShoppingCart,
  Heart,
  MapPin,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

type User = {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: "customer" | "admin";
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  cartCount: number;
  wishlistCount: number;
  addressCount: number;
};

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Stats = {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  verifiedUsers: number;
};

type Filters = {
  search: string;
  role: string;
  status: string;
  verified: string;
  sort: string;
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const timeAgo = (dateStr?: string) => {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const avatarColors = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-600",
  "bg-indigo-500",
  "bg-orange-500",
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

/* ─────────────────────────────────────────────
   Page Component
───────────────────────────────────────────── */

function AdminUsersContent() {
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeUsers: 0, adminUsers: 0, verifiedUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    role: searchParams.get("role") || "",
    status: searchParams.get("status") || "",
    verified: searchParams.get("verified") || "",
    sort: searchParams.get("sort") || "newest",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [actionModal, setActionModal] = useState<{ open: boolean; user: User | null; action: "block" | "unblock" }>({
    open: false,
    user: null,
    action: "block",
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Reset page on filter change
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [debouncedSearch, filters.role, filters.status, filters.verified, filters.sort]);

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.role) params.set("role", filters.role);
    if (filters.status) params.set("status", filters.status);
    if (filters.verified) params.set("verified", filters.verified);
    params.set("sort", filters.sort);
    window.history.replaceState(null, "", `/admin/users?${params.toString()}`);
  }, [currentPage, debouncedSearch, filters.role, filters.status, filters.verified, filters.sort]);

  // Fetch
  const [retryCount, setRetryCount] = useState(0);
  const retry = () => setRetryCount((c) => c + 1);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.role) params.set("role", filters.role);
    if (filters.status) params.set("status", filters.status);
    if (filters.verified) params.set("verified", filters.verified);
    if (filters.sort) params.set("sort", filters.sort);

    fetch(`/api/admin/users?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.success) {
          setUsers(json.data);
          setMeta(json.meta);
          if (json.stats) setStats(json.stats);
        } else {
          setError(json.message || "Failed to load users");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch users:", err);
          setError(err.message || "Failed to load users");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, filters.role, filters.status, filters.verified, filters.sort, retryCount]);

  const goToPage = (page: number) => setCurrentPage(page);

  // Inline toggle
  const toggleField = async (id: string, field: "isActive" | "isVerified", current: boolean) => {
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, [field]: !current } : u)));
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });
      if (!res.ok) {
        setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, [field]: current } : u)));
        toast.error("Failed to update user status");
      } else {
        toast.success("User status updated");
      }
    } catch {
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, [field]: current } : u)));
      toast.error("Failed to update user status");
    }
  };

  // Block / Unblock user
  const handleAction = async () => {
    if (!actionModal.user) return;
    setActionLoading(true);
    const newActive = actionModal.action === "unblock";
    try {
      const res = await fetch(`/api/admin/users/${actionModal.user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === actionModal.user!._id ? { ...u, isActive: newActive } : u))
        );
        toast.success(newActive ? "User unblocked" : "User blocked");
      } else {
        toast.error(`Failed to ${actionModal.action} user`);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setActionLoading(false);
      setActionModal({ open: false, user: null, action: "block" });
    }
  };

  const hasActiveFilters = filters.search || filters.role || filters.status || filters.verified;
  const clearFilters = () => {
    setFilters({ search: "", role: "", status: "", verified: "", sort: "newest" });
    setCurrentPage(1);
  };

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-black">Users</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {meta.total} user{meta.total !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: <UsersIcon size={16} />, color: "text-blue-600 bg-blue-50" },
          { label: "Active", value: stats.activeUsers, icon: <UserCheck size={16} />, color: "text-emerald-600 bg-emerald-50" },
          { label: "Admins", value: stats.adminUsers, icon: <ShieldCheck size={16} />, color: "text-violet-600 bg-violet-50" },
          { label: "Verified", value: `${stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%`, icon: <UserCheck size={16} />, color: "text-amber-600 bg-amber-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`p-1.5 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</span>
            </div>
            <p className="text-xl font-black text-black">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black outline-none text-sm font-medium transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role */}
          <select
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-600 outline-none focus:border-black appearance-none cursor-pointer min-w-[110px]"
          >
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-600 outline-none focus:border-black appearance-none cursor-pointer min-w-[110px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Verified */}
          <select
            value={filters.verified}
            onChange={(e) => setFilters((f) => ({ ...f, verified: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-600 outline-none focus:border-black appearance-none cursor-pointer min-w-[120px]"
          >
            <option value="">All Verified</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-600 outline-none focus:border-black appearance-none cursor-pointer min-w-[110px]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
            >
              <RotateCcw size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Main Card ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
            <p className="mt-3 text-xs text-gray-400 font-medium">Loading users…</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center">
            <AlertTriangle size={28} className="mx-auto text-red-400 mb-3" />
            <p className="text-sm font-bold text-red-500 mb-1">{error}</p>
            <button onClick={retry} className="text-[10px] font-bold uppercase tracking-widest text-black underline underline-offset-2 hover:no-underline">
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <UsersIcon size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-400">No users found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-[11px] font-bold uppercase tracking-widest text-black underline underline-offset-2 hover:no-underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 pl-5 pr-2 py-2.5 w-14">
                    {/* Avatar */}
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    User
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Contact
                  </th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Role
                  </th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Verified
                  </th>

                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Activity
                  </th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2.5">
                    Data
                  </th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 pr-5 py-2.5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className={`border-t transition-colors group ${
                      !user.isActive
                        ? "border-red-200 bg-red-50/50 hover:bg-red-50"
                        : "border-gray-50 hover:bg-gray-50/50"
                    }`}
                  >
                    {/* Avatar */}
                    <td className="pl-5 pr-2 py-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white text-sm font-black`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </td>

                    {/* Name + Email */}
                    <td className="px-3 py-3 max-w-[200px]">
                      <p className="text-[12px] font-bold text-black truncate">{user.name}</p>
                      <p className="text-[10px] font-medium text-gray-400 mt-0.5 truncate">{user.email}</p>
                    </td>

                    {/* Contact */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                        <Phone size={11} className="text-gray-400" />
                        {user.mobile}
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                          user.role === "admin"
                            ? "text-violet-700 bg-violet-50 border-violet-200"
                            : "text-gray-500 bg-gray-50 border-gray-200"
                        }`}
                      >
                        {user.role === "admin" ? <ShieldCheck size={10} /> : <UsersIcon size={10} />}
                        {user.role}
                      </span>
                    </td>

                    {/* Verified Badge */}
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                          user.isVerified
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-red-500 bg-red-50 border-red-200"
                        }`}
                      >
                        {user.isVerified ? <UserCheck size={10} /> : <UserX size={10} />}
                        {user.isVerified ? "Yes" : "No"}
                      </span>
                    </td>



                    {/* Activity */}
                    <td className="px-3 py-3 text-center">
                      <p className="text-[10px] font-bold text-gray-500">{timeAgo(user.lastLoginAt)}</p>
                      <p className="text-[9px] font-medium text-gray-400 mt-0.5">
                        Joined {formatDate(user.createdAt)}
                      </p>
                    </td>

                    {/* Data counts */}
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-gray-400">
                        <span className="flex items-center gap-0.5" title="Cart items">
                          <ShoppingCart size={10} /> {user.cartCount}
                        </span>
                        <span className="flex items-center gap-0.5" title="Wishlist">
                          <Heart size={10} /> {user.wishlistCount}
                        </span>
                        <span className="flex items-center gap-0.5" title="Addresses">
                          <MapPin size={10} /> {user.addressCount}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 pr-5 py-3 text-right">
                      {user.isActive ? (
                        <button
                          onClick={() => setActionModal({ open: true, user, action: "block" })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Block user"
                        >
                          <UserX size={12} />
                          Block
                        </button>
                      ) : (
                        <button
                          onClick={() => setActionModal({ open: true, user, action: "unblock" })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                          title="Unblock user"
                        >
                          <UserCheck size={12} />
                          Unblock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────── */}
        {!loading && !error && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(meta.page - 1)}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 2)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === "string" ? (
                    <span key={`dots-${i}`} className="px-1.5 text-gray-300 text-[10px]">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`min-w-[28px] h-7 rounded-lg text-[11px] font-bold transition-colors ${
                        p === meta.page
                          ? "bg-black text-white"
                          : "text-gray-400 hover:text-black hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => goToPage(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Block / Unblock Confirmation Modal ───────── */}
      {actionModal.open && actionModal.user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${actionModal.action === "block" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-black">
                  {actionModal.action === "block" ? "Block User" : "Unblock User"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to {actionModal.action}{" "}
                  <strong className="text-black">{actionModal.user.name}</strong>?
                  {actionModal.action === "block"
                    ? " They will no longer be able to log in."
                    : " They will regain access to their account."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModal({ open: false, user: null, action: "block" })}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white rounded-lg transition-colors disabled:opacity-50 ${
                  actionModal.action === "block"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                {actionLoading
                  ? (actionModal.action === "block" ? "Blocking…" : "Unblocking…")
                  : (actionModal.action === "block" ? "Block" : "Unblock")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Loading...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
