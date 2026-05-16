"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const looks = [
  { src: "/images/IMG_3649.JPG.jpeg", alt: "Look 1" },
  { src: "/images/IMG_3652.JPG.jpeg", alt: "Look 2" },
  { src: "/images/IMG_3659.JPG.jpeg", alt: "Look 3" },
  { src: "/images/IMG_3669.JPG.jpeg", alt: "Look 4" },
  { src: "/images/IMG_4745.JPG.jpeg", alt: "Look 5" },
];

export default function LooksSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const SCROLL_AMOUNT = 400;

  const getScrollAmount = (el: HTMLDivElement) => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      return el.clientWidth;
    }
    return SCROLL_AMOUNT;
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = getScrollAmount(el);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  return (
    <section className="w-full bg-white py-8 px-6 md:px-10">
      {/* Header */}
      <div className="relative z-20 pointer-events-none ml-6 md:ml-32 mb-4">
        <p
          className="text-lg md:text-2xl font-light leading-snug text-black mb-1"
          style={{ fontFamily: "var(--font-dancing-script), 'Brush Script MT', cursive" }}
        >
          Cala Bimba
        </p>
        <h2
          className="absolute text-4xl md:text-5xl font-black uppercase tracking-tight text-black leading-none mt-1"
          style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
        >
          LOOKS
        </h2>
      </div>

      {/* Image scrollable row wrapper */}
      <div className="relative mt-7 md:mt-9 ml-6 md:ml-32">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Previous"
            className="absolute left-2 md:-left-40 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-28 md:h-28 flex items-center justify-center text-black hover:opacity-70 transition-all"
          >
            <svg className="w-6 h-6 md:w-[72px] md:h-[72px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Next"
            className="absolute right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-28 md:h-28 flex items-center justify-center text-black hover:opacity-70 transition-all"
          >
            <svg className="w-6 h-6 md:w-[72px] md:h-[72px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Scrollable row */}
        <div 
          ref={scrollRef}
          onScroll={updateArrows}
          className="-ml-6 md:-ml-40 pl-6 md:pl-40 flex gap-4 md:gap-6 overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory" 
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
        {looks.map((look, i) => (
          <div
            key={i}
            className="flex-none relative overflow-hidden bg-gray-50 group cursor-pointer w-[calc(100vw-3rem)] md:w-[clamp(220px,24vw,340px)] snap-center aspect-[3/4]"
          >
            <Image
              src={look.src}
              alt={look.alt}
              fill
              sizes="(max-width: 768px) 100vw, 20vw"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ))}
        </div>
      </div>      
    </section>
  );
}
