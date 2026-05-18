import { useCallback, useRef, useState } from "react";

export type ScrollDirection = "left" | "right";

export function useHorizontalScroll(scrollAmount = 400) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  return { scrollRef, canScrollLeft, canScrollRight, scrollBy, updateArrows };
}
