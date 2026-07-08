"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import OrderSummaryCard from "@/components/OrderSummaryCard";

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
  isUnavailable?: boolean;
  isOutOfStock?: boolean;
  availableQuantity?: number;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CartPage() {
  const { cartCount, setCartCount, wishlistIds, toggleWishlistId } = useStore();
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const { data, isLoading, mutate } = useSWR('/api/user/cart', fetcher);

  useEffect(() => {
    if (data?.message === 'Unauthorized') {
      window.location.href = "/login?returnTo=/cart";
    }
  }, [data]);

  const items: CartItem[] = data?.success ? data.data : [];

  const handleRemove = async (id: string) => {
    // Optimistic UI
    const originalItems = [...items];
    const newItems = items.filter(item => item._id !== id);
    mutate({ success: true, data: newItems }, false);

    try {
      const res = await fetch(`/api/user/cart?id=${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (resData.success) {
        // Fetch new cart count
        fetch('/api/user/cart/count').then(r => r.json()).then(d => {
          if (d.success) setCartCount(d.count);
        }).catch(() => {});
        mutate(); // Revalidate from server
      } else {
        mutate({ success: true, data: originalItems }, false);
      }
    } catch (err) {
      mutate({ success: true, data: originalItems }, false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!itemToRemove) return;
    const id = itemToRemove._id;
    setItemToRemove(null);
    await handleRemove(id);
  };

  const handleMoveToWishlist = async () => {
    if (!itemToRemove) return;
    const id = itemToRemove._id;
    const productId = itemToRemove.productId._id;
    setItemToRemove(null);

    const isWishlisted = wishlistIds.has(productId);
    if (!isWishlisted) {
      try {
        toggleWishlistId(productId, 'added'); // Optimistic
        await fetch('/api/user/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });
      } catch (err) {}
    }
    
    await handleRemove(id);
  };


  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Optimistic update
    const originalItems = [...items];
    const newItems = items.map(item => item._id === id ? { ...item, quantity: newQuantity } : item);
    mutate({ success: true, data: newItems }, false);

    try {
      const res = await fetch(`/api/user/cart`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: id, quantity: newQuantity })
      });
      const resData = await res.json();
      if (resData.success) {
        // Fetch new cart count
        fetch('/api/user/cart/count').then(r => r.json()).then(d => {
          if (d.success) setCartCount(d.count);
        }).catch(() => {});
        mutate(); // Revalidate from server
      } else {
        mutate({ success: true, data: originalItems }, false);
      }
    } catch (err) {
      mutate({ success: true, data: originalItems }, false);
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.isUnavailable || item.isOutOfStock) return sum;
      return sum + (item.productId.sellingPrice * item.quantity);
    }, 0);
  }, [items]);

  // Calculate tax breakdown (Assuming 18% GST is included in the selling price)
  const taxAmount = useMemo(() => Math.round(subtotal - (subtotal / 1.18)), [subtotal]);
  const subtotalExclTax = subtotal - taxAmount;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-[120px]">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Bag...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-5 md:pt-[10px] pb-0 md:pb-20 px-3 md:px-6 xl:px-16">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6 mb-5 md:mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider md:tracking-widest text-black mb-2">Shopping Bag</h1>
            <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag size={32} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-black mb-4">Your Bag is Empty</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              Looks like you haven't added anything to your bag yet. Start exploring our collections.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center justify-center bg-black text-white px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Start Exploring
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            
            {/* Left: Cart Items */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {items.map((item) => {
                const colorObj = item.productId.colors?.find((c: any) => c.colorName === item.colorName) || item.productId.colors?.[0];
                const imageUrl = colorObj?.images?.[0]?.url || "https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa";

                return (
                  <div key={item._id} className="flex gap-4 md:gap-6 pb-8 border-b border-gray-100 last:border-0 relative group">
                  
                  {/* Image */}
                  <Link href={`/products/${item.productId.slug}?color=${encodeURIComponent(item.colorName)}`} className="relative w-24 md:w-40 aspect-[3/4] bg-gray-50 flex-shrink-0">
                    <Image
                      src={imageUrl}
                      alt={item.productId.title || "Product image"}
                      fill
                      className={`object-cover ${item.isUnavailable || item.isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                    />
                    {(item.isUnavailable || item.isOutOfStock) && (
                      <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-70 text-white text-[8px] md:text-[10px] font-bold text-center py-1 uppercase tracking-widest">
                        {item.isUnavailable ? 'Unavailable' : 'Out of Stock'}
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex flex-col flex-1 py-1">
                    <div className="flex justify-between items-start gap-4">
                      <Link href={`/products/${item.productId.slug}?color=${encodeURIComponent(item.colorName)}`}>
                        <h3 className="text-xs md:text-base font-bold uppercase tracking-wide text-black leading-snug hover:underline underline-offset-2 md:pr-8">
                          {item.productId.title}
                        </h3>
                      </Link>
                      <button 
                        onClick={() => setItemToRemove(item)}
                        className="hidden md:block absolute right-0 top-1 text-gray-400 hover:text-red-500 transition-colors p-1"
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

                    <div className="flex items-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500 mt-4">
                      {item.colorName !== "Default" && (
                        <span>Color: <span className="text-black">{item.colorName}</span></span>
                      )}
                      {item.colorName !== "Default" && item.size !== "Default" && <span className="text-gray-300">|</span>}
                      {item.size !== "Default" && (
                        <span>Size: <span className="text-black">{item.size}</span></span>
                      )}
                    </div>

                    {/* Quantity Selector + Mobile Delete */}
                    <div className="mt-auto pt-5 md:pt-6 flex justify-between items-end">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 md:mr-4 md:inline-block">
                          Qty:
                        </span>
                        <div className="flex items-center border border-gray-200 h-8 md:h-10 rounded-full md:rounded-none overflow-hidden">
                          <button
                            disabled={item.quantity <= 1 || item.isUnavailable || item.isOutOfStock}
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-[12px] md:h-[12px]">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            disabled={item.isUnavailable || item.isOutOfStock}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                const max = item.availableQuantity || 0;
                                handleUpdateQuantity(item._id, Math.min(val, max));
                              }
                            }}
                            className="w-8 md:w-12 h-full text-center text-xs md:text-sm font-bold focus:outline-none focus:bg-gray-50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-50 disabled:bg-gray-100"
                            style={{ MozAppearance: 'textfield' }}
                          />
                          <button
                            disabled={item.quantity >= (item.availableQuantity || 0) || item.isUnavailable || item.isOutOfStock}
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-[12px] md:h-[12px]">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={() => setItemToRemove(item)}
                        className="md:hidden text-gray-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                  </div>
                </div>
                );
              })}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4 sticky top-24">
              <OrderSummaryCard subtotal={subtotal}>
                <Link 
                  href="/checkout"
                  className="hidden md:flex w-full items-center justify-center gap-3 bg-black text-white px-4 py-5 mt-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all hover:shadow-lg group"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center justify-center gap-2 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
                    Secure checkout powered by Razorpay
                  </p>
                </div>
              </OrderSummaryCard>
            </div>

          </div>
        )}
      </div>

      {/* ── Sticky Mobile Checkout Bar ───────────────────────────────── */}
      {items.length > 0 && (
        <div className="md:hidden sticky bottom-0 -mx-3 mt-8 bg-white border-t border-gray-200 p-4 pb-safe shadow-[0_-8px_20px_rgba(0,0,0,0.04)] z-50">
          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total</span>
              <span className="text-lg font-black text-black leading-none mt-1">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <Link 
              href="/checkout"
              className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform"
            >
              Checkout
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Remove Item Modal ─────────────────────────────────────── */}
      {itemToRemove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 max-w-sm w-full shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-black mb-2">Remove Item?</h3>
              <p className="text-sm text-gray-500 font-medium">Are you sure you want to remove this item from your bag?</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleMoveToWishlist}
                className="w-full bg-black text-white text-xs font-black uppercase tracking-widest py-4 hover:bg-gray-800 transition-colors"
              >
                Move to Wishlist
              </button>
              <button 
                onClick={handleConfirmRemove}
                className="w-full bg-white text-red-500 border border-gray-200 text-xs font-black uppercase tracking-widest py-4 hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                Remove
              </button>
              <button 
                onClick={() => setItemToRemove(null)}
                className="w-full text-xs font-black uppercase tracking-widest text-gray-500 py-2 hover:text-black transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
