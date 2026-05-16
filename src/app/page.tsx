import CalaCollection from "@/components/CalaCollection";
import CategoryBanner from "@/components/CategoryBanner";
import LooksSection from "@/components/LooksSection";
import OurWorld from "@/components/OurWorld";
import NewsletterSection from "@/components/NewsletterSection";



export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Banner */}
      <section className="relative w-full h-[calc(100svh-88px)] md:h-[calc(100vh-88px)]">
        {/* Background Video */}
        <video
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/videos/model.mp4" type="video/mp4" />
        </video>

        {/* Overlay gradient – subtle darkening on left for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />

        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col justify-end pb-10 md:pb-16 pl-6 md:pl-16">
          {/* Brand name */}
          <p
            className="text-4xl md:text-7xl font-black uppercase italic tracking-tight leading-none"
            style={{
              color: "#E8D96A",
              fontFamily: "Arial Black, Impact, sans-serif",
              textShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
          >
            VIIT
          </p>

          {/* Cursive sub-title */}
          <p
            className="text-3xl md:text-6xl leading-tight mt-1"
            style={{
              color: "#E8D96A",
              fontFamily: "var(--font-dancing-script), 'Brush Script MT', cursive",
              textShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
          >
            Cala Bimba
          </p>
        </div>

        {/* Right-side credits */}
        <div
          className="absolute bottom-16 right-10 md:right-16 text-right text-xs md:text-sm leading-relaxed"
          style={{ color: "#E8D96A" }}
        >
        </div>
      </section>
      <CalaCollection />
      <CategoryBanner
        src="/images/IMG_3659.JPG.jpeg"
        category="ACCESSORIES"
        collection="Cala Bimba"
        href="/accessories"
        objectPosition="center 20%"
      />
      {/* White horizontal strip */}
      <div className="w-full bg-white h-4 md:h-8" />
      <CategoryBanner
        src="/images/IMG_4745.JPG.jpeg"
        category="WOMEN CLOTHES"
        collection="Cala Bimba"
        href="/women-clothes"
        objectPosition="center 30%"
      />
      <div className="w-full bg-white h-4 md:h-8" />
      <LooksSection />
      <div className="w-full bg-white h-4 md:h-8" />
      <NewsletterSection />
      <div className="w-full bg-white h-4 md:h-8" />
      <OurWorld />
    </div>

  );
}
