export default function CategorySkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Breadcrumb Skeleton ── */}
      <div className="px-4 md:px-10 xl:px-16 pt-5 pb-2">
        <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
      </div>

      {/* ── Sub-category tab bar Skeleton ── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2 px-4 md:px-10 xl:px-16 py-2.5">
          <div className="h-7 w-24 bg-gray-200 animate-pulse rounded-full" />
          <div className="h-7 w-28 bg-gray-200 animate-pulse rounded-full" />
          <div className="h-7 w-20 bg-gray-200 animate-pulse rounded-full" />
        </div>
      </div>

      {/* ── Filter + Sort bar Skeleton ── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="px-4 md:px-10 xl:px-16 flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="h-8 w-32 bg-gray-200 animate-pulse rounded-full" />
        </div>
      </div>

      {/* ── Product Grid Skeleton ── */}
      <div className="px-3 md:px-10 xl:px-16 py-5 md:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2.5 gap-y-6 md:gap-x-5 md:gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="w-full aspect-[3/4] bg-gray-200 animate-pulse rounded-sm" />
              <div className="h-3 w-3/4 bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
