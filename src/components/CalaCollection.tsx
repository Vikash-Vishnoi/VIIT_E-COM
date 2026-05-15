"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const products = [
  { src: "/images/IMG_3649.JPG.jpeg", label: "BAGS" },
  { src: "/images/IMG_3652.JPG.jpeg", label: "DRESSES" },
  { src: "/images/IMG_3659.JPG.jpeg", label: "CLOTHES" },
  { src: "/images/IMG_3669.JPG.jpeg", label: "TOPS" },
  { src: "/images/IMG_4745.JPG.jpeg", label: "ACCESSORIES" },
    { src: "/images/IMG_3649.JPG.jpeg", label: "BAGS" },
];

export default function CalaCollection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const SCROLL_AMOUNT = 400;

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT, behavior: "smooth" });
  };

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  return (
    <section className="relative w-full bg-white py-10 pl-6 md:pl-10 overflow-hidden">
      {/* Header */}
      <div className="relative z-20 pointer-events-none ml-16 md:ml-32 pr-6 md:pr-10 mb-4">
        <p 
          className="text-xl md:text-2xl italic font-bold text-black mb-1" 
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.02em" }}
        >
          VIIT Collection
        </p>
        <h2
          className="absolute text-4xl md:text-5xl font-black uppercase tracking-tight text-black leading-none mt-1"
          style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
        >
          CALA BIMBA
        </h2>
      </div>

      {/* Carousel wrapper */}
      <div className="relative mt-7 md:mt-9 ml-16 md:ml-32">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Previous"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-24 h-24 flex items-center justify-center text-black hover:opacity-70 transition-all"
            style={{ transform: "translateY(-50%)" }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Next"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-24 h-24 flex items-center justify-center text-black hover:opacity-70 transition-all"
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product, i) => (
            <div key={i} className="flex-none flex flex-col" style={{ width: "clamp(220px, 24vw, 340px)" }}>
              {/* Image */}
              <div className="relative w-full bg-gray-100" style={{ aspectRatio: "3/4" }}>
                <Image
                  src={product.src}
                  alt={product.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover object-top transition-transform duration-500 hover:scale-105"
                />
              </div>
              {/* Category label */}
              <p className="mt-3 text-center text-sm md:text-base font-bold tracking-widest uppercase text-black">
                {product.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
