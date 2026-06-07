"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Forms loading state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Read initial tab from URL
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["overview", "addresses", "orders", "security"].includes(tab)) {
      setActiveTab(tab);
    }
    
    fetchProfile();
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    clearMessages();
    
    // Update URL without reloading the page
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);
    router.replace(`/profile?${params.toString()}`, { scroll: false });
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

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleUpdateOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, mobile: editMobile })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Profile updated successfully!");
        setProfile(data.data);
        window.dispatchEvent(new Event('auth-change')); // Tell header to update name if changed
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
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
        setSuccess(editAddressId ? "Address updated!" : "Address added!");
        setShowAddressForm(false);
        fetchProfile(); // Refresh list
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    clearMessages();
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuccess("Address removed");
        fetchProfile();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to delete address");
    }
  };

  const openEditAddress = (addr: Address) => {
    clearMessages();
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
    clearMessages();
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
    clearMessages();
    
    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match");
    }
    if (newPassword.length < 6) {
      return setError("New password must be at least 6 characters");
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
        setSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
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
    <div className="min-h-screen bg-gray-50 pt-[20px] pb-20 px-6 xl:px-16">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Breadcrumb */}
        <div className="mb-8 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">Profile</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black uppercase tracking-widest text-black mb-2">My Account</h1>
          <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Welcome back, {profile.name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-10">
          
          {/* Sidebar */}
          <div className="bg-white border border-gray-100 p-4 h-fit">
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                      isActive 
                        ? "bg-black text-white" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
              
              <div className="h-px bg-gray-100 my-2"></div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="bg-white border border-gray-100 p-8 min-h-[400px]">
            
            {/* Global Alerts */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-600 text-[11px] font-bold uppercase tracking-wider border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-8 p-4 bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider border border-green-100">
                {success}
              </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-lg font-black uppercase tracking-widest text-black mb-8 border-b border-gray-100 pb-4">Personal Details</h2>
                
                <form onSubmit={handleUpdateOverview} className="max-w-md flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
                    <input 
                      type="email" 
                      value={profile.email}
                      disabled
                      className="w-full border-b-2 border-gray-100 py-2 text-sm text-gray-400 bg-transparent cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Full Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder-gray-300"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mobile Number</label>
                    <input 
                      type="text" 
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, ''))} // only numbers
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder-gray-300"
                      placeholder="Enter mobile number"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="mt-4 px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors self-start"
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
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black hover:opacity-60 transition-opacity"
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Address Type</label>
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
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Receiver's Full Name</label>
                        <input type="text" value={addrFullName} onChange={(e) => setAddrFullName(e.target.value)} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Receiver's Mobile</label>
                        <input type="text" value={addrMobile} onChange={(e) => setAddrMobile(e.target.value.replace(/\D/g, ''))} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Street Address</label>
                        <input type="text" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">City</label>
                        <input type="text" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">State</label>
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
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pincode / Zip Code</label>
                        <input type="text" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} required className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Country</label>
                        <input 
                          type="text" 
                          value={addrCountry} 
                          readOnly 
                          className="w-full border-b-2 border-gray-100 py-2 text-sm text-gray-400 bg-transparent cursor-not-allowed" 
                        />
                      </div>

                      <div className="col-span-2 flex items-center gap-3 mt-2">
                        <input 
                          type="checkbox" 
                          id="isDefault" 
                          checked={addrIsDefault}
                          onChange={(e) => setAddrIsDefault(e.target.checked)}
                          className="w-4 h-4 accent-black"
                        />
                        <label htmlFor="isDefault" className="text-[10px] font-bold uppercase tracking-widest text-black cursor-pointer">
                          Set as Default Address
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-4">
                      <button type="submit" disabled={saving} className="flex-1 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors">
                        {saving ? "Saving..." : "Save Address"}
                      </button>
                      <button type="button" onClick={resetAddressForm} className="px-6 py-3 border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:border-black transition-colors">
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
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-200 px-2 py-1">
                              {addr.label}
                            </span>
                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditAddress(addr)} className="text-gray-400 hover:text-black">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteAddress(addr._id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={14} />
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

            {/* ORDERS TAB (Minimal Placeholder) */}
            {activeTab === "orders" && (
              <div className="animate-in fade-in duration-500 h-full flex flex-col">
                <h2 className="text-lg font-black uppercase tracking-widest text-black mb-8 border-b border-gray-100 pb-4">My Orders</h2>
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Package size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-black mb-2">No Orders Yet</h3>
                  <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                    When you place an order, it will appear here. Start shopping to fill this space!
                  </p>
                  <button 
                    onClick={() => router.push("/")}
                    className="mt-8 px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-lg font-black uppercase tracking-widest text-black mb-8 border-b border-gray-100 pb-4">Change Password</h2>
                
                <form onSubmit={handleChangePassword} className="max-w-md flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder-gray-300"
                    />
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder-gray-300"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder-gray-300"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="mt-4 px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors self-start"
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
