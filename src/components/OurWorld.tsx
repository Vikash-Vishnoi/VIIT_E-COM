"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const cards = [
  { src: "/images/IMG_3649.JPG.jpeg", label: "INSTAGRAM", href: "#", objectPosition: "center top" },
  { src: "/images/IMG_3652.JPG.jpeg", label: "STORES", href: "#", objectPosition: "center 20%" },
  { src: "/images/IMG_3659.JPG.jpeg", label: "LOOKS CALA BIMBA", href: "#", objectPosition: "center 20%" },
  { src: "/images/IMG_3669.JPG.jpeg", label: "APP", href: "#", objectPosition: "center top" },
  { src: "/images/IMG_4745.JPG.jpeg", label: "TIKTOK", href: "#", objectPosition: "center 30%" },
];

export default function OurWorld() {
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
    <section className="w-full bg-white py-8 px-6 md:px-10 overflow-hidden">
      {/* Header */}
      <div className="relative z-20 pointer-events-none ml-16 md:ml-32 mb-4">
        <p
          className="text-lg md:text-2xl font-light leading-snug text-black mb-1"
          style={{ fontFamily: "var(--font-dancing-script), 'Brush Script MT', cursive" }}
        >
          VIIT
        </p>
        <h2
          className="absolute text-4xl md:text-5xl font-black uppercase tracking-tight text-black leading-none mt-1"
          style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
        >
          OUR WORLD
        </h2>
      </div>

      {/* Carousel */}
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
          className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cards.map((card, i) => (
            <Link
              key={i}
              href={card.href}
              className="flex-none flex flex-col group"
              style={{ width: "clamp(220px, 22vw, 305px)" }}
            >
              {/* Image */}
              <div
                className="relative w-full overflow-hidden bg-gray-100"
                style={{ aspectRatio: "3/4" }}
              >
                <Image
                  src={card.src}
                  alt={card.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: card.objectPosition }}
                />
              </div>
              {/* Label */}
              <p className="mt-3 text-center text-sm md:text-base font-bold tracking-widest uppercase text-black">
                {card.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
