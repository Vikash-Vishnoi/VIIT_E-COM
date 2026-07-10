import { connectDB } from "@/lib/db";
import { fetchFeedProducts } from "@/lib/productFeed";
import { FeedSortKey, SORT_OPTIONS } from "@/lib/feedTypes";
import CategoryClientPage from "@/app/[category]/ClientPage";

type SearchParams = { page?: string; sort?: string; minPrice?: string; maxPrice?: string; };

export default async function ViitExclusivePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connectDB();
  const { page: pageParam, sort: sortParam, minPrice, maxPrice } = await searchParams;

  // Resolve sort & page
  const validSorts = SORT_OPTIONS.map((o) => o.value);
  const sort: FeedSortKey = validSorts.includes(sortParam as FeedSortKey)
    ? (sortParam as FeedSortKey)
    : "featured";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const minP = minPrice ? parseInt(minPrice, 10) : undefined;
  const maxP = maxPrice ? parseInt(maxPrice, 10) : undefined;

  // Paginated feed — all products in this category
  const { products, total, totalPages, currentPage } = await fetchFeedProducts(
    { by: "category", slug: "VIIT EXCLUSIVE", minPrice: minP, maxPrice: maxP },
    sort,
    page
  );

  return (
    <CategoryClientPage
      products={products}
      categorySlug="viit-exclusive"
      categoryLabel="VIIT Exclusive"
      subCats={[]}
      currentSort={sort}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
    />
  );
}
