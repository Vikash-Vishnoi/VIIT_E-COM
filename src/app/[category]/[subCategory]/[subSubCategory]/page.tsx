import { connectDB } from "@/lib/db";
import { Product, SubCategory } from "@/models";
import { notFound } from "next/navigation";
import ClientPage, { FormattedProduct, SiblingCategory } from "./ClientPage";

type RouteParams = {
  category: string;
  subCategory: string;
  subSubCategory: string;
};

export default async function CategoryPage({ params }: { params: Promise<RouteParams> }) {
  await connectDB();
  const { category, subCategory, subSubCategory } = await params;

  // 1. Verify the category exists
  const currentCat = await SubCategory.findOne({ 
    slug: subSubCategory, 
    level: 2,
    isActive: true 
  }).lean();

  if (!currentCat) {
    notFound();
  }

  // 2. Fetch siblings (for the horizontal scroll bar)
  // We need to find all sub-sub-categories that share the same parent (which is the subCategory)
  const siblingsData = await SubCategory.find({ 
    parentId: currentCat.parentId, 
    isActive: true 
  }).sort({ sortOrder: 1 }).lean();

  const siblings: SiblingCategory[] = siblingsData.map((s) => ({
    label: s.label,
    slug: s.slug,
  }));

  // 3. Fetch products
  // Based on the Product model, it stores subSubCategory as a string (the slug)
  const dbProducts = await Product.find({ 
    subSubCategory: subSubCategory,
    isActive: true 
  }).lean();

  // 4. Map to frontend format
  const products: FormattedProduct[] = dbProducts.map((p) => {
    // Get first image from first color if available
    const firstColor = p.colors?.[0];
    const firstImage = firstColor?.images?.[0]?.url || "";

    return {
      id: p._id.toString(),
      name: p.title,
      price: p.sellingPrice,
      originalPrice: p.price,
      image: firstImage,
      badge: p.badge || undefined,
      slug: p.slug,
    };
  });

  return (
    <ClientPage 
      products={products}
      categorySlug={category}
      subCategorySlug={subCategory}
      subSubCategorySlug={subSubCategory}
      subSubCategoryLabel={currentCat.label}
      siblings={siblings}
    />
  );
}
