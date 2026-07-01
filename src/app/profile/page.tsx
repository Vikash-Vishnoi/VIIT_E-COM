"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  User as UserIcon, 
  MapPin, 
  Package, 
  ShieldCheck, 
  LogOut,
  Plus,
  Trash2,
  Edit2
} from "lucide-react";
import { validatePassword, passwordErrorMsg } from "@/lib/validation";
import toast from "react-hot-toast";

type OrderItem = {
  productId: string;
  title: string;
  colorName: string;
  size: string;
  quantity: number;
  priceAtOrder: number;
};

type Order = {
  _id: string;
  orderId: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    mobile: string;
  };
  pricing: {
    subtotal: number;
    tax: number;
    shippingFee: number;
    total: number;
  };
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  timeline: { status: string; message: string; timestamp: string }[];
  createdAt: string;
};

type Address = {
  _id: string;
  label: string;
  fullName: string;
  mobile: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

type UserProfile = {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  address: Address[];
};

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Forms loading state
  const [saving, setSaving] = useState(false);

  // Overview Form
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");

  // Address Form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editAddressId, setEditAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrFullName, setAddrFullName] = useState("");
  const [addrMobile, setAddrMobile] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrCountry, setAddrCountry] = useState("India");
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // React to tab changes via URL query params
  useEffect(() => {
    const tab = searchParams.get("tab") || "overview";
    if (["overview", "addresses", "orders", "security"].includes(tab)) {
      setActiveTab(tab);
      if (tab === 'orders') fetchOrders();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Update URL without reloading the page
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.replace(`/profile?${params.toString()}`, { scroll: false });
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/user/orders');
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setEditName(data.data.name);
        setEditMobile(data.data.mobile || "");
      } else {
        // If not logged in, redirect to login
        router.push("/login?returnTo=/profile");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, mobile: editMobile })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully!");
        setProfile(data.data);
        window.dispatchEvent(new Event('auth-change')); // Tell header to update name if changed
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editAddressId ? "PUT" : "POST";
      const payload = {
        addressId: editAddressId,
        label: addrLabel,
        fullName: addrFullName,
        mobile: addrMobile,
        line1: addrLine1,
        city: addrCity,
        state: addrState,
        pincode: addrPincode,
        country: addrCountry,
        isDefault: addrIsDefault
      };
      
      const res = await fetch("/api/user/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editAddressId ? "Address updated!" : "Address added!");
        setShowAddressForm(false);
        fetchProfile(); // Refresh list
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    setAddressToDelete(id);
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    try {
      const res = await fetch(`/api/user/addresses?id=${addressToDelete}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Address removed");
        fetchProfile();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to delete address");
    } finally {
      setAddressToDelete(null);
    }
  };

  const openEditAddress = (addr: Address) => {
    setEditAddressId(addr._id);
    setAddrLabel(addr.label);
    setAddrFullName(addr.fullName);
    setAddrMobile(addr.mobile);
    setAddrLine1(addr.line1);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPincode(addr.pincode);
    setAddrCountry(addr.country);
    setAddrIsDefault(addr.isDefault);
    setShowAddressForm(true);
  };

  const resetAddressForm = () => {
    setEditAddressId(null);
    setAddrLabel("Home");
    setAddrFullName(profile?.name || "");
    setAddrMobile(profile?.mobile || "");
    setAddrLine1("");
    setAddrCity("");
    setAddrState("");
    setAddrPincode("");
    setAddrCountry("India");
    setAddrIsDefault(false);
    setShowAddressForm(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (!validatePassword(newPassword)) {
      return toast.error(passwordErrorMsg);
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Refresh to clear headers and state
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[100px]">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Profile...</div>
      </div>
    );
  }

  if (!profile) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: UserIcon },
    { id: "addresses", label: "Address Book", icon: MapPin },
    { id: "orders", label: "My Orders", icon: Package },
    { id: "security", label: "Security", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-[20px] md:pt-[10px] pb-20 px-4 md:px-6 xl:px-16">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Breadcrumb */}
        <div className="hidden md:block mb-8 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">Profile</span>
        </div>

        {/* Header */}
        <div className="mb-6 md:mb-10 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-black mb-2">My Account</h1>
          <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Welcome back, {profile.name}
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto">
          {/* Main Content Area */}
          <div className="bg-white border border-gray-100 p-4 md:p-8 min-h-[400px]">

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-lg font-black uppercase tracking-widest text-black mb-8 border-b border-gray-100 pb-4">Personal Details</h2>
                
                <form onSubmit={handleUpdateOverview} className="max-w-md flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Email Address</label>
                    <input 
                      type="email" 
                      value={profile.email}
                      disabled
                      className="w-full border-b-2 border-gray-100 py-2 text-sm text-gray-400 bg-transparent cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Full Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Mobile Number</label>
                    <input 
                      type="text" 
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, ''))} // only numbers
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                      placeholder="Enter mobile number"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="mt-4 w-full md:w-auto px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors md:self-start"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>
            )}

            {/* ADDRESS BOOK TAB */}
            {activeTab === "addresses" && (
              <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-black uppercase tracking-widest text-black">Address Book</h2>
                  {!showAddressForm && (
                    <button 
                      onClick={() => {
                        resetAddressForm();
                        setShowAddressForm(true);
                      }}
                      className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-black hover:opacity-60 transition-opacity"
                    >
                      <Plus size={14} /> Add New
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  <form onSubmit={handleSaveAddress} className="max-w-lg flex flex-col gap-6 bg-gray-50 p-6 border border-gray-100 mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-black uppercase tracking-widest">{editAddressId ? "Edit Address" : "New Address"}</h3>
                      <button type="button" onClick={resetAddressForm} className="text-gray-400 hover:text-black">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Address Type</label>
                        <select 
                          value={addrLabel}
                          onChange={(e) => setAddrLabel(e.target.value)}
                          className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                        >
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Receiver's Full Name</label>
                        <input type="text" value={addrFullName} onChange={(e) => setAddrFullName(e.target.value)} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Receiver's Mobile</label>
                        <input type="text" value={addrMobile} onChange={(e) => setAddrMobile(e.target.value.replace(/\D/g, ''))} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Street Address</label>
                        <input type="text" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">City</label>
                        <input type="text" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">State</label>
                        <select 
                          value={addrState} 
                          onChange={(e) => setAddrState(e.target.value)} 
                          required 
                          className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                        >
                          <option value="" disabled>Select State</option>
                          {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Pincode / Zip Code</label>
                        <input type="text" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Country</label>
                        <input 
                          type="text" 
                          value={addrCountry} 
                          readOnly 
                          className="w-full border-b-2 border-gray-100 py-2 text-sm text-gray-400 bg-transparent cursor-not-allowed" 
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2 flex items-center gap-3 mt-2">
                        <input 
                          type="checkbox" 
                          id="isDefault" 
                          checked={addrIsDefault}
                          onChange={(e) => setAddrIsDefault(e.target.checked)}
                          className="w-4 h-4 accent-black"
                        />
                        <label htmlFor="isDefault" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-black cursor-pointer">
                          Set as Default Address
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                      <button type="submit" disabled={saving} className="flex-1 py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors">
                        {saving ? "Saving..." : "Save Address"}
                      </button>
                      <button type="button" onClick={resetAddressForm} className="px-6 py-3.5 border border-gray-200 text-xs font-black uppercase tracking-widest hover:border-black transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.address.length === 0 ? (
                      <div className="col-span-2 p-10 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                        <MapPin size={32} className="text-gray-300 mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No addresses saved yet</p>
                      </div>
                    ) : (
                      profile.address.map((addr) => (
                        <div key={addr._id} className="relative border border-gray-200 p-6 hover:border-black transition-colors group">
                          {addr.isDefault && (
                            <span className="absolute -top-3 left-4 bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1">
                              Default
                            </span>
                          )}
                          
                          <div className="flex justify-between items-start mb-4 mt-2">
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 border border-gray-200 px-2 py-1">
                              {addr.label}
                            </span>
                            <div className="flex gap-4 md:gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditAddress(addr)} className="text-gray-400 hover:text-black">
                                <Edit2 size={16} className="md:w-3.5 md:h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteAddress(addr._id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={16} className="md:w-3.5 md:h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-sm leading-relaxed text-gray-600">
                            <p className="font-semibold text-black">{addr.fullName} <span className="text-xs font-normal text-gray-400 ml-2">{addr.mobile}</span></p>
                            <p className="mt-1">{addr.line1}</p>
                            <p>{addr.city}, {addr.state} {addr.pincode}</p>
                            <p>{addr.country}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-lg font-black uppercase tracking-widest text-black mb-8 border-b border-gray-100 pb-4">My Orders</h2>

                {ordersLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Orders...</div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <Package size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-black mb-2">No Orders Yet</h3>
                    <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-8">
                      When you place an order, it will appear here.
                    </p>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full md:w-auto px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {orders.map((order) => {
                      const isExpanded = expandedOrder === order._id;
                      const statusColor: Record<string, string> = {
                        Placed:    'bg-blue-50 text-blue-600 border-blue-100',
                        Confirmed: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                        Shipped:   'bg-yellow-50 text-yellow-600 border-yellow-100',
                        Delivered: 'bg-green-50 text-green-600 border-green-100',
                        Cancelled: 'bg-red-50 text-red-500 border-red-100',
                        Returned:  'bg-gray-50 text-gray-500 border-gray-200',
                      };
                      const paymentColor: Record<string, string> = {
                        Paid:    'text-green-600',
                        Pending: 'text-yellow-600',
                        Failed:  'text-red-500',
                        Refunded:'text-gray-500',
                      };

                      return (
                        <div key={order._id} className="border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
                          {/* Order Header Row */}
                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                            className="w-full grid grid-cols-2 md:flex md:flex-wrap items-center justify-between gap-4 px-4 md:px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Order ID</span>
                              <span className="text-sm font-black text-black">{order.orderId}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Date</span>
                              <span className="text-sm font-semibold text-black">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Total</span>
                              <span className="text-sm font-black text-black">₹{order.pricing.total.toLocaleString('en-IN')}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Payment</span>
                              <span className={`text-xs font-black uppercase ${paymentColor[order.paymentStatus] || 'text-gray-500'}`}>
                                {order.paymentStatus}
                              </span>
                            </div>

                            <div className="col-span-2 md:col-span-1 flex items-center justify-between md:justify-start gap-3 mt-2 md:mt-0">
                              <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider px-3 py-1 border rounded-full ${statusColor[order.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                {order.status}
                              </span>
                              <svg
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </button>

                          {/* Expanded Detail Panel */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 px-6 py-6 bg-gray-50 flex flex-col gap-8">

                              {/* Items */}
                              <div>
                                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Items Ordered</h4>
                                <div className="flex flex-col gap-3">
                                  {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-start bg-white border border-gray-100 p-4">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-sm font-bold text-black">{item.title}</span>
                                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                          {item.colorName !== 'Default' && <span>Color: {item.colorName}</span>}
                                          {item.size !== 'Default' && <span>Size: {item.size}</span>}
                                          <span>Qty: {item.quantity}</span>
                                        </div>
                                      </div>
                                      <span className="text-sm font-black text-black whitespace-nowrap">
                                        ₹{(item.priceAtOrder * item.quantity).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Pricing + Address split */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

                                {/* Pricing Breakdown */}
                                <div>
                                  <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Pricing</h4>
                                  <div className="flex flex-col gap-2 text-xs md:text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500 font-semibold">Subtotal</span>
                                      <span className="font-bold">₹{(order.pricing.total - order.pricing.tax).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500 font-semibold">GST (18%)</span>
                                      <span className="font-bold">₹{order.pricing.tax.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500 font-semibold">Shipping</span>
                                      <span className="text-green-600 font-black text-[10px] md:text-xs uppercase">Free</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                                      <span className="font-black uppercase tracking-wider text-black">Total</span>
                                      <span className="font-black text-black">₹{order.pricing.total.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] md:text-xs mt-1">
                                      <span className="text-gray-400 font-semibold">Payment Method</span>
                                      <span className="font-bold uppercase">{order.paymentMethod}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Shipping Address */}
                                <div>
                                  <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Delivery Address</h4>
                                  <div className="text-xs md:text-sm text-gray-600 leading-relaxed">
                                    <p className="font-bold text-black">{order.shippingAddress.fullName}</p>
                                    <p>{order.shippingAddress.line1}</p>
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                                    <p className="text-gray-400 text-[10px] md:text-xs mt-1">Ph: {order.shippingAddress.mobile}</p>
                                  </div>
                                </div>

                              </div>

                              {/* Timeline */}
                              {order.timeline && order.timeline.length > 0 && (
                                <div>
                                  <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Order Timeline</h4>
                                  <div className="flex flex-col gap-3">
                                    {[...order.timeline].reverse().map((event, i) => (
                                      <div key={i} className="flex items-start gap-4">
                                        <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                          i === 0 ? 'bg-black' : 'bg-gray-300'
                                        }`} />
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-black">{event.status}</span>
                                          <span className="text-[10px] md:text-xs text-gray-500">{event.message}</span>
                                          <span className="text-[10px] text-gray-400">
                                            {new Date(event.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-lg font-black uppercase tracking-widest text-black mb-8 border-b border-gray-100 pb-4">Change Password</h2>
                
                <form onSubmit={handleChangePassword} className="max-w-md flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="mt-4 w-full md:w-auto px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors md:self-start"
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {addressToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm shadow-2xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="text-red-600" size={28} />
            </div>
            <h2 className="text-lg font-black uppercase tracking-widest text-black mb-3">Delete Address?</h2>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              This action cannot be undone. Are you sure you want to permanently delete this address?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setAddressToDelete(null)}
                className="flex-1 px-4 py-3.5 border border-gray-200 text-xs font-black uppercase tracking-widest hover:border-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAddress}
                className="flex-1 px-4 py-3.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[100px]">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Profile...</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
