import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import ClientPage from "./ClientPage";

export const revalidate = 3600; // Cache for 1 hour

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  await connectDB();
  const product = await Product.findOne({ slug }).lean() as any;
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.title} | VIIT`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  await connectDB();

  const productDoc = await Product.findOne({ slug, isActive: true }).lean();
  if (!productDoc) {
    notFound();
  }

  // Fetch similar products from the same subCategory (excluding the current one)
  const similarDocs = await Product.find({
    subCategory: (productDoc as any).subCategory,
    _id: { $ne: (productDoc as any)._id },
    isActive: true,
  })
    .limit(8)
    .lean();

  // Serialize product for client component
  const product = JSON.parse(JSON.stringify(productDoc));

  // Format similar products for the ProductCard component
  const formattedSimilar = similarDocs.map((p: any) => ({
    id: p._id.toString(),
    name: p.title,
    price: p.sellingPrice,
    originalPrice: p.price,
    image: p.colors?.[0]?.images?.[0]?.url || "",
    badge: p.badge || undefined,
    slug: p.slug,
  }));

  return (
    <ClientPage product={product} similarProducts={formattedSimilar} />
  );
}
