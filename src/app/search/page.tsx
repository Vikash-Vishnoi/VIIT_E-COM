import { connectDB } from "@/lib/db";
import { fetchFeedProducts } from "@/lib/productFeed";
import { FeedSortKey, SORT_OPTIONS } from "@/lib/feedTypes";
import SearchClientPage from "./ClientPage";

type SearchParams = { q?: string; page?: string; sort?: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connectDB();
  const { q = "", page: pageParam, sort: sortParam } = await searchParams;

  // Resolve sort & page
  const validSorts = SORT_OPTIONS.map((o) => o.value);
  const sort: FeedSortKey = validSorts.includes(sortParam as FeedSortKey)
    ? (sortParam as FeedSortKey)
    : "featured";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // Paginated feed — all products matching search query
  const { products, total, totalPages, currentPage } = await fetchFeedProducts(
    { by: "search", q },
    sort,
    page
  );

  return (
    <SearchClientPage
      products={products}
      searchQuery={q}
      currentSort={sort}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
    />
  );
}
