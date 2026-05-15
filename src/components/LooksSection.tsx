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
  return (
    <section className="w-full bg-white py-8 px-6 md:px-10">
      {/* Header */}
      <div className="relative z-20 pointer-events-none mb-4">
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

      {/* Image grid */}
      <div className="grid gap-1 mt-7 md:mt-9" style={{ gridTemplateColumns: `repeat(${looks.length}, 1fr)` }}>
        {looks.map((look, i) => (
          <div
            key={i}
            className="relative overflow-hidden bg-gray-50 group cursor-pointer"
            style={{ aspectRatio: "3/4" }}
          >
            <Image
              src={look.src}
              alt={look.alt}
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ))}
      </div>      
    </section>
  );
}
