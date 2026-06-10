"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export type FormattedProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  badge?: string;
  slug: string;
};

export default function ProductCard({ product }: { product: FormattedProduct }) {
  const [hovered, setHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  useEffect(() => {
    // Check global variable for zero-network validation
    const checkStatus = () => {
      const ids = (window as any).__wishlistIds;
      if (ids) {
        setIsWishlisted(ids.has(product.id));
      }
    };
    
    // Check immediately in case it's already loaded
    checkStatus();
    
    // Listen for when it loads
    window.addEventListener('wishlist-loaded', checkStatus);
    return () => window.removeEventListener('wishlist-loaded', checkStatus);
  }, [product.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Stop navigation
    e.stopPropagation();
    
    if (loadingWishlist) return;
    setLoadingWishlist(true);
    
    // Optimistic UI
    const previousState = isWishlisted;
    setIsWishlisted(!previousState);

    try {
      const res = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      });
      const data = await res.json();
      
      if (data.success) {
        if ((window as any).__wishlistIds) {
          if (data.action === 'added') {
            (window as any).__wishlistIds.add(product.id);
          } else {
            (window as any).__wishlistIds.delete(product.id);
          }
        }
        window.dispatchEvent(new CustomEvent('wishlist-change', { detail: { action: data.action, productId: product.id } }));
      } else if (data.message === 'Unauthorized') {
        // Revert optimistic update and redirect
        setIsWishlisted(previousState);
        sessionStorage.setItem('pendingWishlistAction', product.id);
        window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      } else {
        setIsWishlisted(previousState);
      }
    } catch (err) {
      setIsWishlisted(previousState);
    } finally {
      setLoadingWishlist(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col cursor-pointer" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 rounded-sm mb-3">
        <Image
          src={product.image || "https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa"}
          alt={product.name || "Product image"}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-500 ${hovered ? "scale-105" : "scale-100"}`}
        />

        {product.badge && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full ${
              product.badge === "Sale" ? "bg-red-500 text-white" : "bg-black text-white"
            }`}
          >
            {product.badge}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          disabled={loadingWishlist}
          className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full text-black shadow-sm transition-all z-10"
        >
          <Heart 
            size={16} 
            className={`transition-colors ${isWishlisted ? "fill-black text-black" : "fill-transparent"}`} 
          />
        </button>

      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-black leading-snug line-clamp-2 group-hover:underline underline-offset-2 transition-all">
          {product.name}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-black">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
          {product.originalPrice > product.price && (
            <p className="text-[11px] font-semibold text-gray-400 line-through">
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
