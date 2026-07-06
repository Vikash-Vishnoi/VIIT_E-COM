import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import CarouselSection from "@/components/CarouselSection";

type Card = {
  src: string;
  label: string;
  href: string;
  objectPosition: string;
  external?: boolean;
};

const cards: Card[] = [
  { src: "/images/cala-look-01.JPG.jpeg", label: "INSTAGRAM", href: "https://instagram.com", objectPosition: "center top", external: true },
  { src: "/images/cala-look-03.JPG.jpeg", label: "Facebook", href: "/looks", objectPosition: "center 20%" },
  { src: "/images/cala-look-02.JPG.jpeg", label: "STORES", href: "/store-locator", objectPosition: "center 20%" },
  { src: "/images/cala-look-05.JPG.jpeg", label: "TIKTOK", href: "https://tiktok.com", objectPosition: "center 30%", external: true },
  { src: "/images/cala-look-04.JPG.jpeg", label: "LinkedIn", href: "/app", objectPosition: "center top" },
];

type CardLinkProps = {
  card: Card;
  children: ReactNode;
};

const cardLinkClassName =
  "flex-none flex flex-col group w-[calc(100vw-3rem)] md:w-[clamp(220px,22vw,305px)] snap-center";

function CardLink({ card, children }: CardLinkProps) {
  if (card.external) {
    return (
      <a
        href={card.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardLinkClassName}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={card.href}
      className={cardLinkClassName}
    >
      {children}
    </Link>
  );
}

export default function OurWorld() {
  return (
    <CarouselSection title="Our World" sectionClassName="py-8 px-6 md:px-10 overflow-hidden">
      {cards.map((card) => (
        <CardLink key={card.href} card={card}>
          <div className="relative w-full overflow-hidden bg-gray-100 aspect-[3/4]">
            <Image
              src={card.src}
              alt={card.label}
              fill
              sizes="(max-width: 768px) 100vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ objectPosition: card.objectPosition, willChange: "transform" }}
            />
          </div>
          <p className="mt-3 text-center text-sm md:text-base font-bold tracking-widest uppercase text-black">
            {card.label}
          </p>
        </CardLink>
      ))}
    </CarouselSection>
  );
}
