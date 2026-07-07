"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, Edit2, MapPin } from "lucide-react";
import toast from "react-hot-toast";

export const dynamic = 'force-dynamic';

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

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

function AddressesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/user/addresses");
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data);
        // Auto-open edit form if ?edit=<id> is present
        const editId = searchParams.get('edit');
        if (editId) {
          const addr = data.data.find((a: Address) => a._id === editId);
          if (addr) openEditAddress(addr);
        } else if (searchParams.get('returnTo')) {
          // Came from another page to add a new address — auto-open the add form
          setShowAddressForm(true);
        }
      } else if (res.status === 401) {
        router.push("/login?returnTo=/profile/addresses");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        // If we came from another page (e.g. checkout), redirect back
        const returnTo = searchParams.get('returnTo');
        if (returnTo && returnTo.startsWith('/')) {
          if (!editAddressId && data.id) {
            // New address — append the new ID so checkout auto-selects it
            const separator = returnTo.includes('?') ? '&' : '?';
            router.push(`${returnTo}${separator}selectAddress=${data.id}`);
          } else {
            // Edit — returnTo already contains ?selectAddress=<id>
            router.push(returnTo);
          }
          return;
        }
        fetchAddresses();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    try {
      const res = await fetch(`/api/user/addresses?id=${addressToDelete}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Address removed");
        fetchAddresses();
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
    setAddrFullName("");
    setAddrMobile("");
    setAddrLine1("");
    setAddrCity("");
    setAddrState("");
    setAddrPincode("");
    setAddrCountry("India");
    setAddrIsDefault(false);
    setShowAddressForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Addresses...</div>
      </div>
    );
  }

  return (
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
          {addresses.length === 0 ? (
            <div className="col-span-2 p-10 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
              <MapPin size={32} className="text-gray-300 mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No addresses saved yet</p>
            </div>
          ) : (
            addresses.map((addr) => (
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
                    <button onClick={() => setAddressToDelete(addr._id)} className="text-gray-400 hover:text-red-500">
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

export default function AddressesPageWrapper() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-gray-50 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading...</div>}>
      <AddressesPage />
    </Suspense>
  );
}
