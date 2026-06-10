"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";

type CartItem = {
  _id: string;
  colorName: string;
  size: string;
  quantity: number;
  addedAt: string;
  productId: {
    _id: string;
    title: string;
    slug: string;
    price: number;
    sellingPrice: number;
    colors?: { images: { url: string }[] }[];
    badge?: string;
  };
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/user/cart");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else if (data.message === 'Unauthorized') {
        window.location.href = "/login?returnTo=/cart";
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (id: string) => {
    // Optimistic UI
    const originalItems = [...items];
    setItems(items.filter(item => item._id !== id));

    try {
      const res = await fetch(`/api/user/cart?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new CustomEvent('cart-change', { detail: { action: 'removed', cartItemId: id } }));
      } else {
        setItems(originalItems);
      }
    } catch (err) {
      setItems(originalItems);
    }
  };

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Optimistic update
    const originalItems = [...items];
    setItems(items.map(item => item._id === id ? { ...item, quantity: newQuantity } : item));

    try {
      const res = await fetch(`/api/user/cart`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: id, quantity: newQuantity })
      });
      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new CustomEvent('cart-change', { detail: { action: 'updated', quantity: newQuantity } }));
      } else {
        setItems(originalItems);
      }
    } catch (err) {
      setItems(originalItems);
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.productId.sellingPrice * item.quantity), 0);
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-[120px]">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Bag...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-[120px] pb-20 px-6 xl:px-16">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6 mb-10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-black mb-2">Shopping Bag</h1>
            <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag size={32} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-black mb-4">Your Bag is Empty</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              Looks like you haven't added anything to your bag yet. Start exploring our collections.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center justify-center bg-black text-white px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Start Exploring
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            
            {/* Left: Cart Items */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {items.map((item) => (
                <div key={item._id} className="flex gap-6 pb-8 border-b border-gray-100 last:border-0 relative group">
                  
                  {/* Image */}
                  <Link href={`/products/${item.productId.slug}`} className="relative w-32 md:w-40 aspect-[3/4] bg-gray-50 flex-shrink-0">
                    <Image
                      src={item.productId.colors?.[0]?.images?.[0]?.url || "https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa"}
                      alt={item.productId.title || "Product image"}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex flex-col flex-1 py-1">
                    <div className="flex justify-between items-start gap-4">
                      <Link href={`/products/${item.productId.slug}`}>
                        <h3 className="text-sm md:text-base font-bold uppercase tracking-wide text-black leading-snug hover:underline underline-offset-2 pr-8">
                          {item.productId.title}
                        </h3>
                      </Link>
                      <button 
                        onClick={() => handleRemove(item._id)}
                        className="absolute right-0 top-1 text-gray-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm font-semibold text-black">
                        ₹{item.productId.sellingPrice.toLocaleString("en-IN")}
                      </p>
                      {item.productId.price > item.productId.sellingPrice && (
                        <p className="text-xs font-semibold text-gray-400 line-through">
                          ₹{item.productId.price.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 mt-4">
                      {item.colorName !== "Default" && (
                        <span>Color: <span className="text-black">{item.colorName}</span></span>
                      )}
                      {item.colorName !== "Default" && item.size !== "Default" && <span className="text-gray-300">|</span>}
                      {item.size !== "Default" && (
                        <span>Size: <span className="text-black">{item.size}</span></span>
                      )}
                    </div>

                    {/* Quantity Selector */}
                    <div className="mt-auto pt-6 flex items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mr-4">
                        Qty:
                      </span>
                      <div className="flex items-center border border-gray-200 w-28 h-10">
                        <button
                          disabled={item.quantity <= 1}
                          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                          className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) handleUpdateQuantity(item._id, val);
                          }}
                          className="flex-1 h-full w-full text-center text-[12px] font-bold focus:outline-none focus:bg-gray-50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          style={{ MozAppearance: 'textfield' }}
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4 sticky top-24">
              <div className="bg-gray-50 p-6 md:p-8 flex flex-col gap-6 border border-gray-100">
                <h2 className="text-sm font-black uppercase tracking-widest text-black border-b border-gray-200 pb-4">
                  Order Summary
                </h2>
                
                <div className="flex flex-col gap-4 text-[13px] font-semibold text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="text-black">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Estimated Shipping</span>
                    <span className="text-black uppercase tracking-wider text-[11px] font-black">Free</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taxes</span>
                    <span className="text-black uppercase tracking-wider text-[11px] font-black">Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 text-base font-black uppercase tracking-wide text-black">
                  <span>Total</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <button 
                  className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-4 mt-2 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors"
                >
                  Checkout
                  <ArrowRight size={14} />
                </button>

                <p className="text-[10px] text-center text-gray-400 font-semibold mt-2">
                  Secure checkout powered by Razorpay
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
