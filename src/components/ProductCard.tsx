"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

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

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col cursor-pointer" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 rounded-sm mb-3">
        <Image
          src={product.image || "https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa"}
          alt={product.name}
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

        {/* Quick add */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-black/90 text-white text-[11px] font-black uppercase tracking-widest text-center py-3 transition-transform duration-300 ${
            hovered ? "translate-y-0" : "translate-y-full"
          }`}
        >
          + Quick Add
        </div>
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
