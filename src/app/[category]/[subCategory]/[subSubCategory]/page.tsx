import { connectDB } from "@/lib/db";
import { SubCategory } from "@/models";
import { notFound } from "next/navigation";
import ClientPage, { SiblingCategory } from "./ClientPage";
import { fetchFeedProducts } from "@/lib/productFeed";
import { FeedSortKey, SORT_OPTIONS } from "@/lib/feedTypes";

type RouteParams = {
  category: string;
  subCategory: string;
  subSubCategory: string;
};

type SearchParams = {
  page?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  await connectDB();
  const { category, subCategory, subSubCategory } = await params;
  const { page: pageParam, sort: sortParam, minPrice, maxPrice } = await searchParams;

  // ── Resolve sort ────────────────────────────────────────────────────────
  const validSortValues = SORT_OPTIONS.map((o) => o.value);
  const sort: FeedSortKey = validSortValues.includes(sortParam as FeedSortKey)
    ? (sortParam as FeedSortKey)
    : "featured";

  // ── Resolve page number ──────────────────────────────────────────────────
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const minP = minPrice ? parseInt(minPrice, 10) : undefined;
  const maxP = maxPrice ? parseInt(maxPrice, 10) : undefined;

  // ── 1. Verify the sub-sub-category exists ────────────────────────────────
  const currentCat = await SubCategory.findOne({
    slug: subSubCategory,
    level: 2,
    isActive: true,
  }).lean();

  if (!currentCat) notFound();

  // ── 2. Fetch siblings for the horizontal tab bar ─────────────────────────
  const siblingsData = await SubCategory.find({
    parentId: currentCat.parentId,
    isActive: true,
  })
    .sort({ sortOrder: 1 })
    .lean();

  const siblings: SiblingCategory[] = siblingsData.map((s) => ({
    label: s.label,
    slug: s.slug,
  }));

  // ── 3. Fetch paginated, scored, OOS-filtered products ───────────────────
  const { products, total, totalPages, currentPage } = await fetchFeedProducts(
    { by: 'subSubCategory', slug: subSubCategory, minPrice: minP, maxPrice: maxP },
    sort,
    page
  );

  return (
    <ClientPage
      products={products}
      categorySlug={category}
      subCategorySlug={subCategory}
      subSubCategorySlug={subSubCategory}
      subSubCategoryLabel={currentCat.label}
      siblings={siblings}
      currentSort={sort}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
    />
  );
}
