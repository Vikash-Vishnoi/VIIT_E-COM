"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useStore } from "../store/useStore";

export type FormattedProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  badge?: string;
  slug: string;
  ratings?: { average: number; count: number };
  isUnavailable?: boolean;
  isOutOfStock?: boolean;
};

export default function ProductCard({ product }: { product: FormattedProduct }) {
  const [hovered, setHovered] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  
  const { wishlistIds, toggleWishlistId } = useStore();
  const isWishlisted = wishlistIds.has(product.id);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Stop navigation
    e.stopPropagation();
    
    if (loadingWishlist) return;
    setLoadingWishlist(true);
    
    // Optimistic UI
    const previousState = isWishlisted;
    toggleWishlistId(product.id, previousState ? 'removed' : 'added');

    try {
      const res = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      });
      const data = await res.json();
      
      if (data.success) {
        // Success: state already correctly updated optimistically
      } else if (data.message === 'Unauthorized') {
        // Revert optimistic update and redirect
        toggleWishlistId(product.id, previousState ? 'added' : 'removed');
        sessionStorage.setItem('pendingWishlistAction', product.id);
        window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      } else {
        // Revert on general error
        toggleWishlistId(product.id, previousState ? 'added' : 'removed');
      }
    } catch (err) {
      // Revert on network error
      toggleWishlistId(product.id, previousState ? 'added' : 'removed');
    } finally {
      setLoadingWishlist(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col cursor-pointer" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 rounded-sm mb-2 md:mb-3">
        <Image
          src={product.image || "https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa"}
          alt={product.name || "Product image"}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-500 ${hovered ? "scale-105" : "scale-100"} ${product.isUnavailable || product.isOutOfStock ? "grayscale opacity-75" : ""}`}
        />

        {product.badge && (() => {
          const badgeStyles: Record<string, string> = {
            "Sale":        "bg-red-500 text-white",
            "New":         "bg-emerald-500 text-white",
            "Best Seller": "bg-amber-400 text-black",
            "Limited":     "bg-purple-500 text-white",
            "UNAVAILABLE": "bg-gray-800 text-white",
            "OUT OF STOCK": "bg-gray-600 text-white",
          };
          const cls = badgeStyles[product.badge] ?? "bg-black text-white";
          return (
            <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full ${cls}`}>
              {product.badge}
            </span>
          );
        })()}

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          disabled={loadingWishlist}
          className="absolute top-2 right-2 p-1.5 md:p-2 bg-white/80 hover:bg-white rounded-full text-black shadow-sm transition-all z-10"
        >
          <Heart 
            size={16} 
            className={`transition-colors ${isWishlisted ? "fill-black text-black" : "fill-transparent"}`} 
          />
        </button>

      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-xs md:text-sm font-bold uppercase tracking-wide text-black leading-snug line-clamp-2 group-hover:underline underline-offset-2 transition-all">
          {product.name}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-xs md:text-sm font-semibold text-black">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
          {product.originalPrice > product.price && (
            <p className="text-[10px] md:text-xs font-semibold text-gray-400 line-through">
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </p>
          )}
        </div>

      </div>
    </Link>
  );
}
