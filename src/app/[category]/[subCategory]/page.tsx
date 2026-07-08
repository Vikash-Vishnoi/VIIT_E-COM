import { connectDB } from "@/lib/db";
import { SubCategory } from "@/models";
import { notFound } from "next/navigation";
import { fetchFeedProducts } from "@/lib/productFeed";
import { FeedSortKey, SORT_OPTIONS } from "@/lib/feedTypes";
import SubCategoryClientPage, { SubCatChild } from "./ClientPage";

type RouteParams = { category: string; subCategory: string };
type SearchParams = { page?: string; sort?: string; minPrice?: string; maxPrice?: string; };

export default async function SubCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  await connectDB();
  const { category, subCategory } = await params;
  const { page: pageParam, sort: sortParam, minPrice, maxPrice } = await searchParams;

  // Resolve sort & page
  const validSorts = SORT_OPTIONS.map((o) => o.value);
  const sort: FeedSortKey = validSorts.includes(sortParam as FeedSortKey)
    ? (sortParam as FeedSortKey)
    : "featured";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const minP = minPrice ? parseInt(minPrice, 10) : undefined;
  const maxP = maxPrice ? parseInt(maxPrice, 10) : undefined;

  // 1. Verify the sub-category exists at level 1
  const currentCat = await SubCategory.findOne({
    slug: subCategory,
    level: 1,
    isActive: true,
  }).lean();
  if (!currentCat) notFound();

  // 2. Siblings — other level-1 cats with same parent (for horizontal nav)
  const siblingsData = await SubCategory.find({
    parentId: currentCat.parentId,
    isActive: true,
  })
    .sort({ sortOrder: 1 })
    .lean();

  // 3. Children — level-2 sub-sub-categories (for the "browse sub-types" pills)
  const childrenData = await SubCategory.find({
    parentId: currentCat._id,
    isActive: true,
  })
    .sort({ sortOrder: 1 })
    .lean();

  const children: SubCatChild[] = childrenData.map((c) => ({
    label: c.label,
    slug: c.slug,
  }));

  const siblings = siblingsData.map((s) => ({ label: s.label, slug: s.slug }));

  // 4. Paginated feed — all products in this subCategory
  const { products, total, totalPages, currentPage } = await fetchFeedProducts(
    { by: "subCategory", slug: subCategory, minPrice: minP, maxPrice: maxP },
    sort,
    page
  );

  return (
    <SubCategoryClientPage
      products={products}
      categorySlug={category}
      subCategorySlug={subCategory}
      subCategoryLabel={currentCat.label}
      siblings={siblings}
      children={children}
      currentSort={sort}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
    />
  );
}
