import { useCallback, useEffect, useRef, useState } from "react";

export type ScrollDirection = "left" | "right";

export function useHorizontalScroll(scrollAmount = 400) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const getScrollAmount = useCallback(
    (el: HTMLDivElement) => {
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
        return el.clientWidth;
      }
      return scrollAmount;
    },
    [scrollAmount]
  );

  const scrollBy = useCallback(
    (dir: ScrollDirection) => {
      const el = scrollRef.current;
      if (!el) return;
      const amount = getScrollAmount(el);
      el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    },
    [getScrollAmount]
  );

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const rawProgress = maxScroll <= 0 ? 1 : el.scrollLeft / maxScroll;
    const clampedProgress = Math.min(1, Math.max(0, rawProgress));
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    setScrollProgress(clampedProgress);
  }, []);

  useEffect(() => {
    updateArrows();
    if (typeof window === "undefined") return;
    const handleResize = () => updateArrows();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateArrows]);

  return { scrollRef, canScrollLeft, canScrollRight, scrollBy, updateArrows, scrollProgress };
}
