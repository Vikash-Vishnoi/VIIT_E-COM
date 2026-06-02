"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import CarouselArrows from "@/components/CarouselArrows";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

type CarouselSectionProps = {
  title: string;
  children: ReactNode;
  sectionClassName?: string;
  headerClassName?: string;
  railClassName?: string;
  autoScrollOnHover?: boolean;
};

const baseRailClassName =
  "-ml-6 md:-ml-40 pl-6 md:pl-40 flex gap-4 md:gap-6 overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory";

export default function CarouselSection({
  title,
  children,
  sectionClassName = "",
  headerClassName = "",
  railClassName = "",
  autoScrollOnHover = false,
}: CarouselSectionProps) {
  const {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    scrollBy,
    updateArrows,
    scrollProgress,
  } = useHorizontalScroll();

  useEffect(() => {
    let animationFrameId: number;
    let isHovering = false;

    const el = scrollRef.current;
    if (!el || !autoScrollOnHover) return;

    const handleMouseEnter = () => { isHovering = true; };
    const handleMouseLeave = () => { isHovering = false; };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    const scroll = () => {
      if (isHovering && el) {
        // Adjust scroll speed by changing this value (pixels per frame)
        el.scrollLeft += 0.75; 
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [autoScrollOnHover, scrollRef]);

  return (
    <section className={`w-full bg-white ${sectionClassName}`}>
      <div className={`relative z-20 pointer-events-none ml-6 md:ml-32 mb-4 ${headerClassName}`}>
        <h2 className="absolute -ml-12 md:-ml-13 text-4xl md:text-5xl font-black tracking-tight text-black leading-none mt-1">
          {title}
        </h2>
      </div>

      <div className="relative mt-7 md:mt-9 ml-0 md:ml-20">
        <CarouselArrows
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={() => scrollBy("left")}
          onScrollRight={() => scrollBy("right")}
        />

        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className={`${baseRailClassName} ${
            autoScrollOnHover ? "hover:snap-none hover:scroll-auto" : ""
          } ${railClassName}`.trim()}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>
        <div className="mt-4 mr-6 md:mr-10" aria-hidden="true">
          <div className="h-[3px] w-full rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full bg-black transition-[width] duration-300"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
