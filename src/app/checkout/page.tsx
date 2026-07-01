"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight, ShieldCheck, CreditCard, Banknote, MapPin } from "lucide-react";

type CartItem = {
  _id: string;
  colorName: string;
  size: string;
  quantity: number;
  productId: {
    _id: string;
    title: string;
    sellingPrice: number;
    colors?: { images: { url: string }[] }[];
  };
};

type Address = {
  _id: string;
  label: string;
  fullName: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Selections
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Card");

  // New Address Form State
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "", mobile: "", line1: "", city: "", state: "", pincode: "", isDefault: true
  });
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [cartRes, addrRes] = await Promise.all([
          fetch("/api/user/cart"),
          fetch("/api/user/addresses")
        ]);

        const cartData = await cartRes.json();
        const addrData = await addrRes.json();

        if (cartData.success) {
          setItems(cartData.data);
          if (cartData.data.length === 0) window.location.href = "/cart"; // Redirect empty cart
        } else if (cartData.message === 'Unauthorized') {
          window.location.href = "/login?returnTo=/checkout";
        }

        if (addrData.success) {
          setAddresses(addrData.data);
          const defaultAddr = addrData.data.find((a: Address) => a.isDefault);
          if (defaultAddr) setSelectedAddressId(defaultAddr._id);
          else if (addrData.data.length > 0) setSelectedAddressId(addrData.data[0]._id);
          else setShowNewAddress(true); // Force form if no addresses
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.productId.sellingPrice * item.quantity), 0);
  }, [items]);

  const taxAmount = useMemo(() => Math.round(subtotal - (subtotal / 1.18)), [subtotal]);
  const subtotalExclTax = subtotal - taxAmount;

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress)
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data);
        const added = data.data[data.data.length - 1]; // Latest
        setSelectedAddressId(added._id);
        setShowNewAddress(false);
      } else {
        alert(data.message || "Failed to save address");
      }
    } catch (error) {
      alert("Error saving address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return alert("Please select a shipping address");
    
    setPlacingOrder(true);
    try {
      const res = await fetch("/api/user/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId: selectedAddressId, paymentMethod })
      });
      const data = await res.json();
      
      if (data.success) {
        // Clear global cart counter instantly
        window.dispatchEvent(new CustomEvent('cart-change', { detail: { action: 'cleared' } }));
        window.location.href = `/checkout/success?orderId=${data.orderId}`;
      } else {
        alert(data.message || "Checkout failed");
        setPlacingOrder(false);
      }
    } catch (error) {
      alert("An error occurred during checkout");
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[120px]">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Securing Checkout...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-5 md:pt-[10px] pb-0 md:pb-20 px-3 md:px-6 xl:px-16">
      <div className="max-w-[1200px] mx-auto">
        
        <div className="mb-10 text-center">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-black mb-2">Secure Checkout</h1>
          <p className="text-xs font-bold tracking-widest text-gray-400 flex items-center justify-center gap-2 uppercase">
            <ShieldCheck size={14} /> 256-bit Encryption
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Accordions */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Step 1: Shipping Address */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="bg-black px-4 py-3 md:px-6 md:py-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-[10px]">1</span>
                  Shipping Address
                </h2>
              </div>
              
              <div className="p-4 md:p-6">
                {!showNewAddress && addresses.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <label 
                          key={addr._id}
                          className={`relative flex flex-col gap-1 p-3 md:p-4 border rounded-sm cursor-pointer transition-all ${
                            selectedAddressId === addr._id 
                              ? "border-black bg-gray-50 ring-1 ring-black" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="address" 
                            className="sr-only"
                            checked={selectedAddressId === addr._id}
                            onChange={() => setSelectedAddressId(addr._id)}
                          />
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-black uppercase tracking-wider">{addr.label}</span>
                            {selectedAddressId === addr._id && <Check size={16} strokeWidth={3} className="text-black" />}
                          </div>
                          <span className="text-sm font-bold text-black capitalize">{addr.fullName}</span>
                          <span className="text-xs md:text-sm text-gray-500">{addr.line1}</span>
                          {addr.line2 && <span className="text-xs md:text-sm text-gray-500">{addr.line2}</span>}
                          <span className="text-xs md:text-sm text-gray-500">{addr.city}, {addr.state} {addr.pincode}</span>
                          <span className="text-xs md:text-sm text-gray-500 mt-1">Ph: {addr.mobile}</span>
                        </label>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowNewAddress(true)}
                      className="mt-2 text-xs font-black uppercase tracking-widest text-black underline underline-offset-4 self-start hover:opacity-60"
                    >
                      + Add New Address
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveAddress} className="flex flex-col gap-4 max-w-md">
                    <div className="grid grid-cols-1 gap-4">
                      <input required type="text" placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black rounded-sm" />
                      <input required type="text" placeholder="Mobile Number" value={newAddress.mobile} onChange={e => setNewAddress({...newAddress, mobile: e.target.value})} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black rounded-sm" />
                      <input required type="text" placeholder="Flat / House No. / Building" value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black rounded-sm" />
                      <div className="grid grid-cols-2 gap-4">
                        <input required type="text" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black rounded-sm" />
                        <input required type="text" placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black rounded-sm" />
                      </div>
                      <input required type="text" placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black rounded-sm" />
                    </div>
                    <div className="flex gap-4 mt-2">
                      <button type="submit" disabled={savingAddress} className="flex-1 bg-black text-white py-3 text-xs font-black uppercase tracking-widest rounded-sm hover:bg-gray-800 disabled:opacity-50">
                        {savingAddress ? "Saving..." : "Save & Deliver Here"}
                      </button>
                      {addresses.length > 0 && (
                        <button type="button" onClick={() => setShowNewAddress(false)} className="flex-1 bg-white border border-gray-300 text-black py-3 text-xs font-black uppercase tracking-widest rounded-sm hover:bg-gray-50">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Step 2: Payment */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="bg-black text-white px-4 py-3 md:px-6 md:py-4">
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] bg-white text-black">2</span>
                  Payment Method
                </h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="flex flex-col gap-3">
                  {[
                    { id: "Card", label: "Credit / Debit Card", icon: CreditCard },
                    { id: "UPI", label: "UPI (Google Pay, PhonePe, Paytm)", icon: ShieldCheck },
                    { id: "COD", label: "Cash on Delivery", icon: Banknote },
                  ].map((method) => (
                    <label 
                      key={method.id}
                      className={`relative flex items-center gap-3 md:gap-4 p-3 md:p-4 border rounded-sm cursor-pointer transition-all ${
                        paymentMethod === method.id 
                          ? "border-black bg-gray-50 ring-1 ring-black" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        className="sr-only"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? "border-black" : "border-gray-300"}`}>
                        {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                      </div>
                      <method.icon size={20} className="text-gray-500" />
                      <span className="text-sm font-bold text-black uppercase tracking-wider">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white p-4 md:p-8 flex flex-col gap-5 md:gap-6 border-none md:border-solid md:border md:border-gray-200 shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-sm pb-8 md:pb-8">
              <h2 className="hidden md:block text-lg font-black uppercase tracking-widest text-black border-b border-gray-100 pb-4">
                Review Order
              </h2>

              {/* Items Preview */}
              <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item._id} className="flex items-center gap-4">
                    <div className="relative w-16 aspect-[3/4] bg-gray-100 flex-shrink-0">
                      <Image
                        src={item.productId.colors?.[0]?.images?.[0]?.url || "https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa"}
                        alt={item.productId.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-xs font-bold uppercase truncate max-w-[180px]">{item.productId.title}</span>
                      <span className="text-[10px] text-gray-500 uppercase mt-1">
                        {item.colorName !== "Default" && `${item.colorName}`}
                        {item.size !== "Default" && ` | Size: ${item.size}`}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 mt-1">Qty: {item.quantity}</span>
                    </div>
                    <div className="text-xs font-black">
                      ₹{(item.productId.sellingPrice * item.quantity).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Calculations */}
              <div className="flex flex-col gap-4 text-xs md:text-sm font-semibold text-gray-500 pt-2">
                <div className="flex justify-between items-center">
                  <span>Subtotal (Excl. Tax)</span>
                  <span className="text-black font-bold">₹{subtotalExclTax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Estimated Tax (18% GST)</span>
                  <span className="text-black font-bold">₹{taxAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Estimated Shipping</span>
                  <span className="text-green-600 uppercase tracking-wider text-[10px] md:text-xs font-black bg-green-50 px-2 py-1 rounded-sm">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-6 border-t border-gray-200 mt-2">
                <div className="flex flex-col">
                  <span className="text-base font-black uppercase tracking-wide text-black">Total</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Incl. of all taxes</span>
                </div>
                <span className="text-2xl font-black text-black leading-none">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={placingOrder || !selectedAddressId || showNewAddress}
                className="hidden md:flex w-full items-center justify-center gap-3 bg-black text-white px-4 py-5 mt-4 text-sm font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed"
              >
                {placingOrder ? "Processing..." : `Pay ₹${subtotal.toLocaleString("en-IN")}`}
              </button>

              <div className="flex items-center justify-center gap-2 mt-1">
                <ShieldCheck size={14} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Payments encrypted by standard SSL
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Sticky Mobile Checkout Bar ───────────────────────────────── */}
      <div className="md:hidden sticky bottom-0 -mx-3 mt-4 bg-white border-t border-gray-200 p-4 pb-safe shadow-[0_-8px_20px_rgba(0,0,0,0.04)] z-50">
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total</span>
            <span className="text-lg font-black text-black leading-none mt-1">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <button 
            onClick={handlePlaceOrder}
            disabled={placingOrder || !selectedAddressId || showNewAddress}
            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placingOrder ? "Processing..." : "Pay Now"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
