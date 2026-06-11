type CarouselArrowsProps = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onMouseEnterLeft: () => void;
  onMouseLeaveLeft: () => void;
  onMouseEnterRight: () => void;
  onMouseLeaveRight: () => void;
};

export default function CarouselArrows({
  canScrollLeft,
  canScrollRight,
  onMouseEnterLeft,
  onMouseLeaveLeft,
  onMouseEnterRight,
  onMouseLeaveRight,
}: CarouselArrowsProps) {
  return (
    <>
      {canScrollLeft && (
        <button
          onMouseEnter={onMouseEnterLeft}
          onMouseLeave={onMouseLeaveLeft}
          aria-label="Scroll left"
          className="absolute left-2 md:-left-40 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-28 md:h-28 flex items-center justify-center text-black hover:opacity-70 transition-all cursor-w-resize"
        >
          <svg className="w-6 h-6 md:w-[72px] md:h-[72px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          onMouseEnter={onMouseEnterRight}
          onMouseLeave={onMouseLeaveRight}
          aria-label="Scroll right"
          className="absolute right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-28 md:h-28 flex items-center justify-center text-black hover:opacity-70 transition-all cursor-e-resize"
        >
          <svg className="w-6 h-6 md:w-[72px] md:h-[72px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </>
  );
}
