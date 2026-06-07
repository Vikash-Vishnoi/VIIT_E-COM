"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import ProductCard, { FormattedProduct } from "@/components/ProductCard";

type WishlistItem = {
  _id: string;
  colorName: string;
  size: string;
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

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await fetch("/api/user/wishlist");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else if (data.message === 'Unauthorized') {
        window.location.href = "/login?returnTo=/wishlist";
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
    
    // Listen for global wishlist toggles to instantly remove items from the grid
    const handleWishlistChange = (e: any) => {
      if (e.detail && e.detail.action === 'removed' && e.detail.productId) {
        setItems(prev => prev.filter(item => item.productId._id !== e.detail.productId));
      }
    };
    
    window.addEventListener('wishlist-change', handleWishlistChange);
    return () => window.removeEventListener('wishlist-change', handleWishlistChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-[120px]">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Wishlist...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-[120px] pb-20 px-6 xl:px-16">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6 mb-10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-black mb-2">My Wishlist</h1>
            <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
              {items.length} {items.length === 1 ? 'Item' : 'Items'} Saved
            </p>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Heart size={32} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-black mb-4">Your Wishlist is Empty</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              Looks like you haven't saved any items yet. Start exploring our collections and click the heart icon to save your favorites for later!
            </p>
            <Link 
              href="/"
              className="inline-flex items-center justify-center bg-black text-white px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Start Exploring
            </Link>
          </div>
        )}

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {items.map((item) => {
            const formattedProduct: FormattedProduct = {
              id: item.productId._id,
              name: item.productId.title,
              price: item.productId.sellingPrice,
              originalPrice: item.productId.price,
              image: item.productId.colors?.[0]?.images?.[0]?.url || "https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa",
              badge: item.productId.badge || undefined,
              slug: item.productId.slug,
            };
            return <ProductCard key={item._id} product={formattedProduct} />;
          })}
        </div>
      </div>
    </div>
  );
}
