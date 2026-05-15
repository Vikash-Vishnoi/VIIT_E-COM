"use client";

import Image from "next/image";
import Link from "next/link";

interface CategoryBannerProps {
  src: string;
  category: string;         // e.g. "CLOTHES"
  collection?: string;      // e.g. "Cala Bimba"
  href?: string;
  objectPosition?: string;  // e.g. "center top"
}

export default function CategoryBanner({
  src,
  category,
  collection = "Cala Bimba",
  href = "#",
  objectPosition = "center center",
}: CategoryBannerProps) {
  return (
    <section className="relative w-full overflow-hidden" style={{ height: "clamp(380px, 55vw, 620px)" }}>
      {/* Background image */}
      <Image
        src={src}
        alt={category}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition }}
      />

      {/* Subtle dark-to-transparent gradient on the left for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />

      {/* Text block — top left */}
      <div className="absolute top-8 left-8 md:top-10 md:left-12 text-white">
        {/* Cursive collection name */}
        <p
          className="text-lg md:text-2xl font-light leading-snug"
          style={{ fontFamily: "var(--font-dancing-script), 'Brush Script MT', cursive" }}
        >
          {collection}
        </p>

        {/* Bold category name */}
        <Link href={href}>
          <h2
            className="text-4xl md:text-6xl font-black uppercase leading-none tracking-tight mt-0.5 hover:underline"
            style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
          >
            {category}
          </h2>
        </Link>
      </div>

      {/* Buy Now Button — bottom left */}
      <div className="absolute bottom-8 left-8 md:bottom-10 md:left-12">
        <Link 
          href={href}
          className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs md:text-sm hover:bg-black hover:text-white transition-colors duration-300 shadow-sm"
        >
          Buy Now
        </Link>
      </div>
    </section>
  );
}
