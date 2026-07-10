export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      {/* ── Breadcrumb Skeleton ── */}
      <div className="px-3 md:px-10 xl:px-16 pt-5 md:pt-8 pb-3 md:pb-4">
        <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
      </div>

      <div className="px-0 md:px-10 xl:px-16 pb-0 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* ── Left side: Image Gallery Skeleton ── */}
          <div className="lg:col-span-7 flex md:grid flex-nowrap md:grid-cols-2 overflow-x-hidden md:overflow-visible gap-0 md:gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="relative aspect-[3/4] w-[85vw] md:w-full flex-shrink-0 bg-gray-200 animate-pulse rounded-sm" />
            ))}
          </div>

          {/* ── Right side: Sticky Info Panel Skeleton ── */}
          <div className="lg:col-span-5 flex flex-col gap-5 md:gap-6 px-4 md:px-0 pt-4 md:pt-0">
            
            <div className="flex flex-col gap-2">
              <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="flex items-start justify-between gap-4 mt-1">
                <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded" />
                <div className="flex items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                </div>
              </div>
              <div className="flex items-baseline gap-3 mt-3">
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="h-3 w-32 bg-gray-200 animate-pulse rounded mt-1" />
            </div>

            {/* Colors Skeleton */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="flex gap-2">
                <div className="w-12 h-16 rounded-sm bg-gray-200 animate-pulse" />
                <div className="w-12 h-16 rounded-sm bg-gray-200 animate-pulse" />
              </div>
            </div>

            {/* Sizes Skeleton */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-14 h-12 rounded bg-gray-200 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="hidden md:flex gap-4 mt-6">
              <div className="flex-1 py-6 bg-gray-200 animate-pulse rounded" />
            </div>

            {/* Features Skeleton */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-y border-gray-100 py-6 mt-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
