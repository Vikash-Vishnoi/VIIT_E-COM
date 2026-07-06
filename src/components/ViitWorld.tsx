import Image from "next/image";
import Link from "next/link";
import CarouselSection from "@/components/CarouselSection";

const products = [
  { src: "/images/cala-look-01.JPG.jpeg", label: "VIIT Exclusive", href: "/viit-exclusive" },
  { src: "/images/cala-look-02.JPG.jpeg", label: "MAN", href: "/man" },
  { src: "/images/cala-look-03.JPG.jpeg", label: "WOMAN", href: "/woman" },
  { src: "/images/cala-look-04.JPG.jpeg", label: "KIDS", href: "/kids" },
  { src: "/images/cala-look-05.JPG.jpeg", label: "ACCESSORIES", href: "/accessories" },
];

export default function Category() {
  return (
    <CarouselSection
      title="VIIT World"
      sectionClassName="py-10 pl-6 md:pl-10 overflow-hidden"
      headerClassName="pr-6 md:pr-10"
      autoScrollOnHover={true}
    >
      {products.map((product) => (
        <Link
          key={product.href}
          href={product.href}
          aria-label={product.label}
          className="flex-none flex flex-col w-[calc(100vw-3rem)] md:w-[clamp(220px,24vw,340px)] snap-center"
        >
          <div className="relative w-full bg-gray-100 aspect-[3/4]">
            <Image
              src={product.src}
              alt={product.label}
              fill
              sizes="(max-width: 768px) 100vw, 20vw"
              className="object-cover object-top transition-transform duration-500 hover:scale-105"
              style={{ willChange: "transform" }}
            />
          </div>
          <p className="mt-3 text-center text-sm md:text-base font-bold tracking-widest uppercase text-black">
            {product.label}
          </p>
        </Link>
      ))}
    </CarouselSection>
  );
}
