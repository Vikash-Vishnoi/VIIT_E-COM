"use client";

import type { ReactNode } from "react";
import { useRef, useEffect } from "react";
import CarouselArrows from "@/components/CarouselArrows";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

type CarouselSectionProps = {
  title: string;
  children: ReactNode;
  sectionClassName?: string;
  headerClassName?: string;
  railClassName?: string;
  /** @deprecated No longer used */
  autoScrollOnHover?: boolean;
};

const baseRailClassName =
  "-ml-6 md:-ml-40 pl-6 md:pl-40 flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide";

export default function CarouselSection({
  title,
  children,
  sectionClassName = "",
  headerClassName = "",
  railClassName = "",
}: CarouselSectionProps) {
  const {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    updateArrows,
    scrollProgress,
  } = useHorizontalScroll();

  const rafRef = useRef<number | null>(null);
  const dirRef = useRef<number>(0); // -1 left | 0 stop | 1 right

  const stopLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    dirRef.current = 0;
  };

  const startLoop = (direction: number) => {
    // Update direction immediately
    dirRef.current = direction;

    // Only start one loop at a time
    if (rafRef.current !== null) return;

    const tick = () => {
      const el = scrollRef.current;
      const dir = dirRef.current;

      if (!el || dir === 0) {
        // stopped externally — exit without scheduling another frame
        rafRef.current = null;
        return;
      }

      el.scrollLeft += dir * 3;
      updateArrows(); // Update progress bar explicitly during arrow hover scroll

      // Auto-stop at boundaries
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      const atStart = el.scrollLeft <= 2;
      if ((dir > 0 && atEnd) || (dir < 0 && atStart)) {
        stopLoop();
        updateArrows(); // final arrow state update
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  // Sync arrow visibility after each programmatic scroll
  const handleScroll = () => updateArrows();

  // Cleanup on unmount
  useEffect(() => () => stopLoop(), []);

  return (
    <section className={`w-full bg-white ${sectionClassName}`}>
      <div className={`relative z-20 pointer-events-none ml-10 md:ml-32 mb-4 ${headerClassName}`}>
        <h2 className="absolute -ml-12 md:-ml-13 text-4xl md:text-5xl font-black tracking-tight text-black leading-none mt-1">
          {title}
        </h2>
      </div>

      <div className="relative mt-7 md:mt-9 ml-0 md:ml-20">
        <CarouselArrows
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onMouseEnterLeft={() => startLoop(-1)}
          onMouseLeaveLeft={stopLoop}
          onMouseEnterRight={() => startLoop(1)}
          onMouseLeaveRight={stopLoop}
        />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={`${baseRailClassName} ${railClassName}`.trim()}
        >
          {children}
        </div>

        <div className="mt-4 mr-6 md:mr-10" aria-hidden="true">
          <div className="h-[3px] w-full rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full bg-black"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
