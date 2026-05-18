import Category from "@/components/Category";
import CategoryBanner from "@/components/CategoryBanner";
import Looks from "@/components/Looks";
import StorySection from "@/components/StorySection";
import OurWorld from "@/components/OurWorld";
import Newsletter from "@/components/Newsletter";
import SectionDivider from "@/components/SectionDivider";
import Image from "next/image";



export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Banner */}
      <section className="relative w-full h-[calc(100svh-88px)] md:h-[calc(100vh-88px)]">
        {/* Background image (replaced video) */}
        <Image
          src="/images/cala-look-01.JPG.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_40%]"
          aria-hidden="true"
        />

        {/* Overlay gradient – subtle darkening on left for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />

        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col justify-end pb-10 md:pb-16 pl-6 md:pl-16">
          {/* Brand name */}
          <h1
            className="text-4xl md:text-7xl font-black uppercase italic tracking-tight leading-none"
            style={{
              color: "#E8D96A",
              textShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
          >
            VIIT
          </h1>

          {/* Cursive sub-title */}
          <p
            className="text-3xl md:text-6xl leading-tight mt-1 font-script"
            style={{
              color: "#E8D96A",
              textShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
          >
            Venom i Try
          </p>
        </div>

      </section>
      <Category />
      <CategoryBanner
        src="/images/cala-look-03.JPG.jpeg"
        category="Women's Universe"
        uppercase={false}
        href="/accessories"
        objectPosition="center 20%"
      />
      <SectionDivider />
      <CategoryBanner
        src="/images/cala-look-05.JPG.jpeg"
        category="Accessories"
        uppercase={false}
        href="/women-clothes"
        objectPosition="center 30%"
      />
      <SectionDivider />
      <Looks />
      <SectionDivider />
      <StorySection />
      <SectionDivider />
      <Newsletter />
      <SectionDivider />
      <OurWorld />
    </div>

  );
}
