import Image from "next/image";
import Link from "next/link";

interface CategoryBannerProps {
  src: string;
  category: string;         // e.g. "CLOTHES"
  href: string;
  objectPosition?: string;  // e.g. "center top"
  priority?: boolean;
  subtitle?: string;
  uppercase?: boolean;
}

export default function CategoryBanner({
  src,
  category,
  href,
  objectPosition = "center center",
  priority = false,
  subtitle,
  uppercase = true,
}: CategoryBannerProps) {
  return (
    <section className="relative w-full overflow-hidden" style={{ height: "clamp(390px, 57vw, 640px)" }}>
      {/* Background image */}
      <Image
        src={src}
        alt={category}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition }}
      />

      {/* Subtle dark-to-transparent gradient on the left for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />

      {/* Text block — top left */}
      <div className="absolute top-8 left-8 md:top-10 md:left-12 text-white">
        {/* Subtitle */}
        {subtitle && (
          <p
            className="text-lg md:text-2xl font-light leading-snug"
          >
            {subtitle}
          </p>
        )}

        {/* Bold category name */}
        <Link href={href}>
          <h2
            className={`text-4xl md:text-6xl font-black leading-none tracking-tight mt-0.5 hover:underline ${uppercase ? "uppercase" : ""}`}
          >
            {category}
          </h2>
        </Link>
      </div>

      {/* Buy Now Button — bottom left */}
      <div className="absolute bottom-8 left-8 md:bottom-10 md:left-12 -translate-y-30 md:-translate-y-40">
        <Link 
          href={href}
          className="inline-flex items-center justify-center px-4 py-2 text-black font-bold uppercase tracking-widest text-sm md:text-base hover:underline"
          style={{ transform: "scale(1.3)", transformOrigin: "left bottom" }}
        >
          Shop Now &gt;
        </Link>
      </div>
    </section>
  );
}
