"use client";

import Image from "next/image";
import Link from "next/link";

const cards = [
  { src: "/images/IMG_3649.JPG.jpeg", label: "INSTAGRAM",       href: "#", objectPosition: "center top" },
  { src: "/images/IMG_3652.JPG.jpeg", label: "STORES",          href: "#", objectPosition: "center 20%" },
  { src: "/images/IMG_3659.JPG.jpeg", label: "LOOKS CALA BIMBA",href: "#", objectPosition: "center 20%" },
  { src: "/images/IMG_3669.JPG.jpeg", label: "APP",             href: "#", objectPosition: "center top" },
  { src: "/images/IMG_4745.JPG.jpeg", label: "TIKTOK",          href: "#", objectPosition: "center 30%" },
];

export default function OurWorld() {

  return (
    <section className="w-full bg-white py-8 px-6 md:px-10 overflow-hidden">
      {/* Header */}
      <div className="relative z-20 pointer-events-none mb-4">
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
      <div className="relative mt-7 md:mt-9">
        {/* Scrollable row */}
        <div
          className="flex gap-4 md:gap-6 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cards.map((card, i) => (
            <Link
              key={i}
              href={card.href}
              className="flex-none flex flex-col group"
              style={{ width: "clamp(180px, 20vw, 270px)" }}
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
