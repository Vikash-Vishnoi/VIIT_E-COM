import { connectDB } from "@/lib/db";
import { SubCategory } from "@/models";
import { notFound } from "next/navigation";
import { fetchFeedProducts } from "@/lib/productFeed";
import { FeedSortKey, SORT_OPTIONS } from "@/lib/feedTypes";
import CategoryClientPage, { SubCatCard } from "./ClientPage";

type RouteParams  = { category: string };
type SearchParams = { page?: string; sort?: string };

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  await connectDB();
  const { category } = await params;
  const { page: pageParam, sort: sortParam } = await searchParams;

  // Resolve sort & page
  const validSorts = SORT_OPTIONS.map((o) => o.value);
  const sort: FeedSortKey = validSorts.includes(sortParam as FeedSortKey)
    ? (sortParam as FeedSortKey)
    : "featured";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // 1. Verify the top-level category exists at level 0
  const currentCat = await SubCategory.findOne({
    slug: category,
    level: 0,
    isActive: true,
  }).lean();
  if (!currentCat) notFound();

  // 2. Level-1 sub-categories (for the showcase cards at the top)
  const subCatsData = await SubCategory.find({
    parentId: currentCat._id,
    isActive: true,
  })
    .sort({ sortOrder: 1 })
    .lean();

  const subCats: SubCatCard[] = subCatsData.map((s) => ({
    label: s.label,
    slug: s.slug,

  }));

  // 3. Paginated feed — all products in this top-level category
  const { products, total, totalPages, currentPage } = await fetchFeedProducts(
    { by: "category", slug: category },
    sort,
    page
  );

  return (
    <CategoryClientPage
      products={products}
      categorySlug={category}
      categoryLabel={currentCat.label}

      subCats={subCats}
      currentSort={sort}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
    />
  );
}
