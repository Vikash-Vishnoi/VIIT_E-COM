import Image from "next/image";
import CarouselSection from "@/components/CarouselSection";

const looks = [
  { src: "/images/cala-look-01.JPG.jpeg", alt: "Look 1" },
  { src: "/images/cala-look-02.JPG.jpeg", alt: "Look 2" },
  { src: "/images/cala-look-03.JPG.jpeg", alt: "Look 3" },
  { src: "/images/cala-look-04.JPG.jpeg", alt: "Look 4" },
  { src: "/images/cala-look-05.JPG.jpeg", alt: "Look 5" },
];

export default function Looks() {
  return (
    <CarouselSection title="Own iT" sectionClassName="py-8 px-6 md:px-10">
      {looks.map((look) => (
        <div
          key={look.src}
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
    </CarouselSection>
  );
}
