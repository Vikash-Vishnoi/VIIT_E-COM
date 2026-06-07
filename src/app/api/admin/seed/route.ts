import { connectDB } from '@/lib/db';
import {
  Product,
  User,
  Order,
  Review,
  Coupon,
  InventoryLog,
  SubCategory,
  Notification,
  Cart,
  Wishlist,
} from '@/models';
import mongoose from 'mongoose';

// ── force dynamic — never cache this route ──────────────────────────
export const dynamic = 'force-dynamic';

// ── helper: slug from text ──────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── placeholder image URL ───────────────────────────────────────────
const IMG = (n: number) =>
  `https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa`;

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/seed
// ─────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectDB();

    // ── 1. Clear every collection ─────────────────────────────────
    await Promise.all([
      Product.deleteMany({}),
      User.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      InventoryLog.deleteMany({}),
      SubCategory.deleteMany({}),
      Notification.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
    ]);

    // ── 2. Seed SubCategories ─────────────────────────────────────
    // Level 0 — top-level categories
    const [man, woman, kids, accessories] = await SubCategory.insertMany([
      { slug: 'man', label: 'MAN', level: 0, sortOrder: 0, isActive: true },
      { slug: 'woman', label: 'WOMAN', level: 0, sortOrder: 1, isActive: true },
      { slug: 'kids', label: 'KIDS', level: 0, sortOrder: 2, isActive: true },
      { slug: 'accessories', label: 'ACCESSORIES', level: 0, sortOrder: 3, isActive: true },
    ]);

    // Level 1 — sub-categories
    const [manDenim, manCasual, manLinen, womanEdits, womanEssentials, kidsClothing, accCollection] = await SubCategory.insertMany([
      { slug: 'man-denim', label: 'Denim', parentId: man._id, level: 1, sortOrder: 0, isActive: true },
      { slug: 'man-casual', label: 'Casual', parentId: man._id, level: 1, sortOrder: 1, isActive: true },
      { slug: 'man-linen', label: 'Linen', parentId: man._id, level: 1, sortOrder: 2, isActive: true },
      { slug: 'woman-edits', label: 'Collections & Edits', parentId: woman._id, level: 1, sortOrder: 0, isActive: true },
      { slug: 'woman-essentials', label: 'Essentials', parentId: woman._id, level: 1, sortOrder: 1, isActive: true },
      { slug: 'kids-clothing', label: 'Clothing', parentId: kids._id, level: 1, sortOrder: 0, isActive: true },
      { slug: 'accessories-collection', label: 'Collections', parentId: accessories._id, level: 1, sortOrder: 0, isActive: true },
    ]);

    // Level 2 — MAN
    await SubCategory.insertMany([
      { slug: 'jacket', label: 'Denim Jacket', parentId: manDenim._id, level: 2, sortOrder: 0, isActive: true },
      { slug: 'mens-jeans', label: 'Denim Jeans', parentId: manDenim._id, level: 2, sortOrder: 1, isActive: true },
      { slug: 'tshirt', label: 'T-Shirts', parentId: manCasual._id, level: 2, sortOrder: 0, isActive: true },
      { slug: 'polo', label: 'Polo', parentId: manCasual._id, level: 2, sortOrder: 1, isActive: true },
      { slug: 'shirt', label: 'Linen Shirts', parentId: manLinen._id, level: 2, sortOrder: 0, isActive: true },
      { slug: 'mens-trousers', label: 'Linen Trousers', parentId: manLinen._id, level: 2, sortOrder: 1, isActive: true },
    ]);

    // Level 2 — KIDS
    await SubCategory.insertMany([
      { slug: 'girls-dresses', label: "Girls' Dresses", parentId: kidsClothing._id, level: 2, sortOrder: 0, isActive: true },
      { slug: 'party-princess', label: 'Party Princess', parentId: kidsClothing._id, level: 2, sortOrder: 1, isActive: true },
      { slug: 'casual-cuties', label: 'Casual Cuties', parentId: kidsClothing._id, level: 2, sortOrder: 2, isActive: true },
      { slug: 'mini-occasion', label: 'Mini Occasion Wear', parentId: kidsClothing._id, level: 2, sortOrder: 3, isActive: true },
    ]);

    // Level 2 — ACCESSORIES
    await SubCategory.insertMany([
      { slug: 'brooches', label: 'Brooches', parentId: accCollection._id, level: 2, sortOrder: 0, isActive: true },
      { slug: 'silk-stories', label: 'Silk Stories (scarves)', parentId: accCollection._id, level: 2, sortOrder: 1, isActive: true },
      { slug: 'leg-couture', label: 'Leg Couture (stockings)', parentId: accCollection._id, level: 2, sortOrder: 2, isActive: true },
      { slug: 'hand-luxe', label: 'Hand Luxe (gloves)', parentId: accCollection._id, level: 2, sortOrder: 3, isActive: true },
    ]);

    // Level 2 — WOMAN (Edits)
    await SubCategory.insertMany([
      { slug: 'casual-edit', label: 'Casual Edit', parentId: womanEdits._id, level: 2, sortOrder: 0, isActive: true },
      { slug: 'summer-stories', label: 'Summer Stories', parentId: womanEdits._id, level: 2, sortOrder: 1, isActive: true },
      { slug: 'winter-luxe', label: 'Winter Luxe', parentId: womanEdits._id, level: 2, sortOrder: 2, isActive: true },
      { slug: 'party-icons', label: 'Party Icons', parentId: womanEdits._id, level: 2, sortOrder: 3, isActive: true },
      { slug: 'street-muse', label: 'Street Muse', parentId: womanEdits._id, level: 2, sortOrder: 4, isActive: true },
      { slug: 'club-nights', label: 'Club Nights', parentId: womanEdits._id, level: 2, sortOrder: 5, isActive: true },
      { slug: 'mall-edit', label: 'Mall Edit', parentId: womanEdits._id, level: 2, sortOrder: 6, isActive: true },
      { slug: 'date-night', label: 'Date Night', parentId: womanEdits._id, level: 2, sortOrder: 7, isActive: true },
      { slug: 'dinner-glam', label: 'Dinner Glam', parentId: womanEdits._id, level: 2, sortOrder: 8, isActive: true },
      { slug: 'resort-escape', label: 'Resort Escape', parentId: womanEdits._id, level: 2, sortOrder: 9, isActive: true },
      { slug: 'vacation-edit', label: 'Vacation Edit', parentId: womanEdits._id, level: 2, sortOrder: 10, isActive: true },
      { slug: 'lounge-luxe', label: 'Lounge Luxe', parentId: womanEdits._id, level: 2, sortOrder: 11, isActive: true },
      { slug: 'work-chic', label: 'Work Chic', parentId: womanEdits._id, level: 2, sortOrder: 12, isActive: true },
      { slug: 'evening-affair', label: 'Evening Affair', parentId: womanEdits._id, level: 2, sortOrder: 13, isActive: true },
      { slug: 'statement-looks', label: 'Statement Looks', parentId: womanEdits._id, level: 2, sortOrder: 14, isActive: true },
      { slug: 'new-arrivals', label: 'New Arrivals', parentId: womanEdits._id, level: 2, sortOrder: 15, isActive: true },
    ]);

    // Level 2 — WOMAN (Essentials)
    await SubCategory.insertMany([
      { slug: 'denim', label: 'Denim Edit', parentId: womanEssentials._id, level: 2, sortOrder: 0, isActive: true },
      { slug: 'womens-jeans', label: 'Jeans', parentId: womanEssentials._id, level: 2, sortOrder: 1, isActive: true },
      { slug: 'shorts', label: 'Shorts', parentId: womanEssentials._id, level: 2, sortOrder: 2, isActive: true },
      { slug: 'womens-trousers', label: 'Trousers', parentId: womanEssentials._id, level: 2, sortOrder: 3, isActive: true },
      { slug: 'pants', label: 'Pants', parentId: womanEssentials._id, level: 2, sortOrder: 4, isActive: true },
      { slug: 'skirts', label: 'Skirts', parentId: womanEssentials._id, level: 2, sortOrder: 5, isActive: true },
      { slug: 'bodysuits', label: 'Bodysuits', parentId: womanEssentials._id, level: 2, sortOrder: 6, isActive: true },
      { slug: 'tops', label: 'Tops', parentId: womanEssentials._id, level: 2, sortOrder: 7, isActive: true },
      { slug: 'shirts', label: 'Shirts', parentId: womanEssentials._id, level: 2, sortOrder: 8, isActive: true },
      { slug: 'coords', label: 'Co-ord Sets', parentId: womanEssentials._id, level: 2, sortOrder: 9, isActive: true },
      { slug: 'dresses', label: 'Dresses', parentId: womanEssentials._id, level: 2, sortOrder: 10, isActive: true },
      { slug: 'kaftans', label: 'Kaftans', parentId: womanEssentials._id, level: 2, sortOrder: 11, isActive: true },
      { slug: 'jumpsuits', label: 'Jumpsuits', parentId: womanEssentials._id, level: 2, sortOrder: 12, isActive: true },
      { slug: 'blazers', label: 'Blazers', parentId: womanEssentials._id, level: 2, sortOrder: 13, isActive: true },
      { slug: 'knitwear', label: 'Knitwear', parentId: womanEssentials._id, level: 2, sortOrder: 14, isActive: true },
    ]);

    const subCategoryCount = await SubCategory.countDocuments();

    // ── 3. Seed Products ──────────────────────────────────────────
    const productsData = [
      // ── MAN > Denim > Denim Jacket ──
      {
        category: 'man', subCategory: 'man-denim', subSubCategory: 'jacket',
        title: 'Classic Indigo Denim Jacket',
        slug: slugify('Classic Indigo Denim Jacket'),
        description: 'A timeless denim jacket crafted from premium 12oz indigo-dyed cotton. Features a classic trucker silhouette with antique brass buttons and dual chest pockets.',
        price: 4999, sellingPrice: 3799,
        colors: [
          {
            colorName: 'Indigo Blue',
            images: [{ url: IMG(1), order: 0 }, { url: IMG(2), order: 1 }],
            sizes: [
              { size: 'S', quantity: 18, sku: 'VIIT-DJ-IND-S-001' },
              { size: 'M', quantity: 25, sku: 'VIIT-DJ-IND-M-001' },
              { size: 'L', quantity: 22, sku: 'VIIT-DJ-IND-L-001' },
              { size: 'XL', quantity: 14, sku: 'VIIT-DJ-IND-XL-001' },
            ],
          },
          {
            colorName: 'Washed Black',
            images: [{ url: IMG(3), order: 0 }, { url: IMG(4), order: 1 }],
            sizes: [
              { size: 'S', quantity: 12, sku: 'VIIT-DJ-BLK-S-001' },
              { size: 'M', quantity: 20, sku: 'VIIT-DJ-BLK-M-001' },
              { size: 'L', quantity: 16, sku: 'VIIT-DJ-BLK-L-001' },
              { size: 'XL', quantity: 8, sku: 'VIIT-DJ-BLK-XL-001' },
            ],
          },
        ],
        badge: 'Best Seller', isFeatured: true, isActive: true,
        ratings: { average: 4.5, count: 218 },
      },
      {
        category: 'man', subCategory: 'man-denim', subSubCategory: 'jacket',
        title: 'Distressed Trucker Denim Jacket',
        slug: slugify('Distressed Trucker Denim Jacket'),
        description: 'Rugged distressed denim jacket with a relaxed fit. Hand-faded finish gives each piece a unique vintage character.',
        price: 5499, sellingPrice: 4299,
        colors: [
          {
            colorName: 'Light Wash',
            images: [{ url: IMG(5), order: 0 }, { url: IMG(6), order: 1 }],
            sizes: [
              { size: 'M', quantity: 15, sku: 'VIIT-DJ-LTW-M-002' },
              { size: 'L', quantity: 20, sku: 'VIIT-DJ-LTW-L-002' },
              { size: 'XL', quantity: 10, sku: 'VIIT-DJ-LTW-XL-002' },
            ],
          },
        ],
        badge: 'New', isFeatured: false, isActive: true,
        ratings: { average: 4.1, count: 42 },
      },
      // ── MAN > Denim > Denim Jeans ──
      {
        category: 'man', subCategory: 'man-denim', subSubCategory: 'mens-jeans',
        title: 'Slim Fit Washed Jeans',
        slug: slugify('Slim Fit Washed Jeans'),
        description: 'Modern slim-fit jeans with a mid-rise waist and subtle whisker wash. Made from stretch denim for all-day comfort without compromising style.',
        price: 3499, sellingPrice: 2699,
        colors: [
          {
            colorName: 'Mid Blue',
            images: [{ url: IMG(7), order: 0 }, { url: IMG(8), order: 1 }, { url: IMG(9), order: 2 }],
            sizes: [
              { size: '28', quantity: 20, sku: 'VIIT-JN-MBL-28-001' },
              { size: '30', quantity: 30, sku: 'VIIT-JN-MBL-30-001' },
              { size: '32', quantity: 28, sku: 'VIIT-JN-MBL-32-001' },
              { size: '34', quantity: 18, sku: 'VIIT-JN-MBL-34-001' },
            ],
          },
          {
            colorName: 'Dark Rinse',
            images: [{ url: IMG(10), order: 0 }, { url: IMG(11), order: 1 }],
            sizes: [
              { size: '30', quantity: 22, sku: 'VIIT-JN-DRK-30-001' },
              { size: '32', quantity: 26, sku: 'VIIT-JN-DRK-32-001' },
              { size: '34', quantity: 15, sku: 'VIIT-JN-DRK-34-001' },
            ],
          },
        ],
        badge: 'Sale', isFeatured: true, isActive: true,
        ratings: { average: 4.3, count: 175 },
      },
      {
        category: 'man', subCategory: 'man-denim', subSubCategory: 'mens-jeans',
        title: 'Relaxed Taper Raw Denim Jeans',
        slug: slugify('Relaxed Taper Raw Denim Jeans'),
        description: 'Raw selvedge denim jeans with a relaxed tapered fit. Crafted from Japanese 14oz denim that develops a beautiful fade pattern over time.',
        price: 5999, sellingPrice: 5999,
        colors: [
          {
            colorName: 'Raw Indigo',
            images: [{ url: IMG(12), order: 0 }, { url: IMG(13), order: 1 }],
            sizes: [
              { size: '30', quantity: 10, sku: 'VIIT-JN-RAW-30-002' },
              { size: '32', quantity: 14, sku: 'VIIT-JN-RAW-32-002' },
              { size: '34', quantity: 8, sku: 'VIIT-JN-RAW-34-002' },
              { size: '36', quantity: 5, sku: 'VIIT-JN-RAW-36-002' },
            ],
          },
        ],
        badge: 'Limited', isFeatured: false, isActive: true,
        ratings: { average: 4.7, count: 34 },
      },
      // ── MAN > Linen > Linen Shirt ──
      {
        category: 'man', subCategory: 'man-linen', subSubCategory: 'shirt',
        title: 'Pure Linen Mandarin Collar Shirt',
        slug: slugify('Pure Linen Mandarin Collar Shirt'),
        description: 'Breathable 100% European linen shirt with a mandarin collar. Perfect for Indian summers — stays cool and looks effortlessly refined.',
        price: 2999, sellingPrice: 2499,
        colors: [
          {
            colorName: 'Classic White',
            images: [{ url: IMG(14), order: 0 }, { url: IMG(15), order: 1 }],
            sizes: [
              { size: 'S', quantity: 22, sku: 'VIIT-LS-WHT-S-001' },
              { size: 'M', quantity: 30, sku: 'VIIT-LS-WHT-M-001' },
              { size: 'L', quantity: 25, sku: 'VIIT-LS-WHT-L-001' },
              { size: 'XL', quantity: 15, sku: 'VIIT-LS-WHT-XL-001' },
            ],
          },
          {
            colorName: 'Sky Blue',
            images: [{ url: IMG(16), order: 0 }, { url: IMG(17), order: 1 }],
            sizes: [
              { size: 'S', quantity: 18, sku: 'VIIT-LS-SKY-S-001' },
              { size: 'M', quantity: 24, sku: 'VIIT-LS-SKY-M-001' },
              { size: 'L', quantity: 20, sku: 'VIIT-LS-SKY-L-001' },
            ],
          },
          {
            colorName: 'Sage Green',
            images: [{ url: IMG(18), order: 0 }, { url: IMG(19), order: 1 }],
            sizes: [
              { size: 'M', quantity: 16, sku: 'VIIT-LS-SGE-M-001' },
              { size: 'L', quantity: 14, sku: 'VIIT-LS-SGE-L-001' },
              { size: 'XL', quantity: 10, sku: 'VIIT-LS-SGE-XL-001' },
            ],
          },
        ],
        badge: 'New', isFeatured: true, isActive: true,
        ratings: { average: 4.6, count: 87 },
      },
      // ── MAN > Linen > Linen Trousers ──
      {
        category: 'man', subCategory: 'man-linen', subSubCategory: 'mens-trousers',
        title: 'Linen Relaxed Trousers',
        slug: slugify('Linen Relaxed Trousers'),
        description: 'Lightweight linen trousers with an elastic waistband and drawstring. Features a relaxed straight-leg cut ideal for casual outings and weekend brunches.',
        price: 2799, sellingPrice: 2199,
        colors: [
          {
            colorName: 'Sand Beige',
            images: [{ url: IMG(20), order: 0 }, { url: IMG(21), order: 1 }],
            sizes: [
              { size: '30', quantity: 20, sku: 'VIIT-LT-BEG-30-001' },
              { size: '32', quantity: 28, sku: 'VIIT-LT-BEG-32-001' },
              { size: '34', quantity: 22, sku: 'VIIT-LT-BEG-34-001' },
            ],
          },
          {
            colorName: 'Olive',
            images: [{ url: IMG(22), order: 0 }, { url: IMG(23), order: 1 }],
            sizes: [
              { size: '30', quantity: 15, sku: 'VIIT-LT-OLV-30-001' },
              { size: '32', quantity: 18, sku: 'VIIT-LT-OLV-32-001' },
              { size: '34', quantity: 12, sku: 'VIIT-LT-OLV-34-001' },
            ],
          },
        ],
        badge: null, isFeatured: false, isActive: true,
        ratings: { average: 4.2, count: 63 },
      },
      // ── MAN > Casual > T-Shirt ──
      {
        category: 'man', subCategory: 'man-casual', subSubCategory: 'tshirt',
        title: 'Oversized Drop Shoulder Tee',
        slug: slugify('Oversized Drop Shoulder Tee'),
        description: 'Premium 240 GSM cotton oversized tee with a drop-shoulder cut. Pre-washed for an ultra-soft hand feel right out of the box.',
        price: 1499, sellingPrice: 1199,
        colors: [
          {
            colorName: 'Charcoal Grey',
            images: [{ url: IMG(24), order: 0 }, { url: IMG(25), order: 1 }],
            sizes: [
              { size: 'S', quantity: 40, sku: 'VIIT-TS-GRY-S-001' },
              { size: 'M', quantity: 50, sku: 'VIIT-TS-GRY-M-001' },
              { size: 'L', quantity: 45, sku: 'VIIT-TS-GRY-L-001' },
              { size: 'XL', quantity: 30, sku: 'VIIT-TS-GRY-XL-001' },
            ],
          },
          {
            colorName: 'Off White',
            images: [{ url: IMG(26), order: 0 }, { url: IMG(27), order: 1 }],
            sizes: [
              { size: 'S', quantity: 35, sku: 'VIIT-TS-OWH-S-001' },
              { size: 'M', quantity: 42, sku: 'VIIT-TS-OWH-M-001' },
              { size: 'L', quantity: 38, sku: 'VIIT-TS-OWH-L-001' },
              { size: 'XL', quantity: 25, sku: 'VIIT-TS-OWH-XL-001' },
            ],
          },
          {
            colorName: 'Black',
            images: [{ url: IMG(28), order: 0 }, { url: IMG(29), order: 1 }],
            sizes: [
              { size: 'S', quantity: 50, sku: 'VIIT-TS-BLK-S-001' },
              { size: 'M', quantity: 60, sku: 'VIIT-TS-BLK-M-001' },
              { size: 'L', quantity: 55, sku: 'VIIT-TS-BLK-L-001' },
              { size: 'XL', quantity: 35, sku: 'VIIT-TS-BLK-XL-001' },
            ],
          },
        ],
        badge: 'Best Seller', isFeatured: true, isActive: true,
        ratings: { average: 4.4, count: 280 },
      },
      // ── MAN > Casual > Polo ──
      {
        category: 'man', subCategory: 'man-casual', subSubCategory: 'polo',
        title: 'Piqué Cotton Polo',
        slug: slugify('Pique Cotton Polo'),
        description: 'Classic fit piqué cotton polo with a ribbed collar and two-button placket. Features embroidered VIIT logo on the chest.',
        price: 1999, sellingPrice: 1599,
        colors: [
          {
            colorName: 'Navy Blue',
            images: [{ url: IMG(30), order: 0 }, { url: IMG(31), order: 1 }],
            sizes: [
              { size: 'S', quantity: 20, sku: 'VIIT-PO-NVY-S-001' },
              { size: 'M', quantity: 30, sku: 'VIIT-PO-NVY-M-001' },
              { size: 'L', quantity: 25, sku: 'VIIT-PO-NVY-L-001' },
              { size: 'XL', quantity: 15, sku: 'VIIT-PO-NVY-XL-001' },
            ],
          },
          {
            colorName: 'Burgundy',
            images: [{ url: IMG(32), order: 0 }, { url: IMG(33), order: 1 }],
            sizes: [
              { size: 'M', quantity: 18, sku: 'VIIT-PO-BRG-M-001' },
              { size: 'L', quantity: 22, sku: 'VIIT-PO-BRG-L-001' },
              { size: 'XL', quantity: 12, sku: 'VIIT-PO-BRG-XL-001' },
            ],
          },
        ],
        badge: null, isFeatured: false, isActive: true,
        ratings: { average: 4.0, count: 95 },
      },
      // ── WOMAN > Western > Tops ──
      {
        category: 'woman', subCategory: 'woman-essentials', subSubCategory: 'tops',
        title: 'Ruffle Sleeve Crop Top',
        slug: slugify('Ruffle Sleeve Crop Top'),
        description: 'A flirty crop top with statement ruffle sleeves in breezy georgette. Pair it with high-waisted jeans or a skirt for an effortless look.',
        price: 1799, sellingPrice: 1399,
        colors: [
          {
            colorName: 'Blush Pink',
            images: [{ url: IMG(34), order: 0 }, { url: IMG(35), order: 1 }],
            sizes: [
              { size: 'XS', quantity: 15, sku: 'VIIT-WT-PNK-XS-001' },
              { size: 'S', quantity: 25, sku: 'VIIT-WT-PNK-S-001' },
              { size: 'M', quantity: 30, sku: 'VIIT-WT-PNK-M-001' },
              { size: 'L', quantity: 18, sku: 'VIIT-WT-PNK-L-001' },
            ],
          },
          {
            colorName: 'Ivory',
            images: [{ url: IMG(36), order: 0 }, { url: IMG(37), order: 1 }],
            sizes: [
              { size: 'S', quantity: 20, sku: 'VIIT-WT-IVR-S-001' },
              { size: 'M', quantity: 22, sku: 'VIIT-WT-IVR-M-001' },
              { size: 'L', quantity: 14, sku: 'VIIT-WT-IVR-L-001' },
            ],
          },
        ],
        badge: 'New', isFeatured: true, isActive: true,
        ratings: { average: 4.3, count: 112 },
      },
      // ── WOMAN > Western > Dresses ──
      {
        category: 'woman', subCategory: 'woman-essentials', subSubCategory: 'dresses',
        title: 'Floral Midi Wrap Dress',
        slug: slugify('Floral Midi Wrap Dress'),
        description: 'A flattering wrap-style midi dress in a vibrant floral print. Crafted from soft viscose with a tie waist and flared skirt.',
        price: 3499, sellingPrice: 2799,
        colors: [
          {
            colorName: 'Teal Floral',
            images: [{ url: IMG(38), order: 0 }, { url: IMG(39), order: 1 }, { url: IMG(40), order: 2 }],
            sizes: [
              { size: 'XS', quantity: 10, sku: 'VIIT-DR-TFL-XS-001' },
              { size: 'S', quantity: 18, sku: 'VIIT-DR-TFL-S-001' },
              { size: 'M', quantity: 22, sku: 'VIIT-DR-TFL-M-001' },
              { size: 'L', quantity: 16, sku: 'VIIT-DR-TFL-L-001' },
            ],
          },
        ],
        badge: 'Sale', isFeatured: false, isActive: true,
        ratings: { average: 4.6, count: 68 },
      },
      // ── WOMAN > Western > Skirts ──
      {
        category: 'woman', subCategory: 'woman-essentials', subSubCategory: 'skirts',
        title: 'Pleated A-Line Midi Skirt',
        slug: slugify('Pleated A-Line Midi Skirt'),
        description: 'Elegant pleated midi skirt with an A-line silhouette. Features a concealed side zip and satin-finish fabric that drapes beautifully.',
        price: 2499, sellingPrice: 1999,
        colors: [
          {
            colorName: 'Dusty Rose',
            images: [{ url: IMG(41), order: 0 }, { url: IMG(42), order: 1 }],
            sizes: [
              { size: 'S', quantity: 14, sku: 'VIIT-SK-RSE-S-001' },
              { size: 'M', quantity: 20, sku: 'VIIT-SK-RSE-M-001' },
              { size: 'L', quantity: 16, sku: 'VIIT-SK-RSE-L-001' },
            ],
          },
          {
            colorName: 'Midnight Black',
            images: [{ url: IMG(43), order: 0 }, { url: IMG(44), order: 1 }],
            sizes: [
              { size: 'S', quantity: 18, sku: 'VIIT-SK-BLK-S-001' },
              { size: 'M', quantity: 24, sku: 'VIIT-SK-BLK-M-001' },
              { size: 'L', quantity: 20, sku: 'VIIT-SK-BLK-L-001' },
              { size: 'XL', quantity: 12, sku: 'VIIT-SK-BLK-XL-001' },
            ],
          },
        ],
        badge: null, isFeatured: false, isActive: true,
        ratings: { average: 3.9, count: 45 },
      },
      // ── WOMAN > Denim > Denim Jacket ──
      {
        category: 'woman', subCategory: 'woman-essentials', subSubCategory: 'denim',
        title: 'Cropped Denim Jacket',
        slug: slugify('Cropped Denim Jacket'),
        description: 'A cropped denim jacket with a boxy fit, perfect for layering over dresses and jumpsuits. Finished with silver-tone hardware and frayed hems.',
        price: 3999, sellingPrice: 3299,
        colors: [
          {
            colorName: 'Light Blue',
            images: [{ url: IMG(45), order: 0 }, { url: IMG(46), order: 1 }],
            sizes: [
              { size: 'S', quantity: 16, sku: 'VIIT-WDJ-LBL-S-001' },
              { size: 'M', quantity: 22, sku: 'VIIT-WDJ-LBL-M-001' },
              { size: 'L', quantity: 18, sku: 'VIIT-WDJ-LBL-L-001' },
            ],
          },
          {
            colorName: 'Stone Wash',
            images: [{ url: IMG(47), order: 0 }, { url: IMG(48), order: 1 }],
            sizes: [
              { size: 'S', quantity: 12, sku: 'VIIT-WDJ-STN-S-001' },
              { size: 'M', quantity: 18, sku: 'VIIT-WDJ-STN-M-001' },
              { size: 'L', quantity: 14, sku: 'VIIT-WDJ-STN-L-001' },
            ],
          },
        ],
        badge: 'Best Seller', isFeatured: false, isActive: true,
        ratings: { average: 4.4, count: 156 },
      },
      // ── WOMAN > Denim > Denim Jeans ──
      {
        category: 'woman', subCategory: 'woman-essentials', subSubCategory: 'womens-jeans',
        title: 'High Rise Straight Leg Jeans',
        slug: slugify('High Rise Straight Leg Jeans'),
        description: 'Flattering high-rise jeans with a straight-leg cut. Made from premium stretch denim with a touch of elastane for a comfortable, sculpted fit.',
        price: 3299, sellingPrice: 2599,
        colors: [
          {
            colorName: 'Deep Indigo',
            images: [{ url: IMG(49), order: 0 }, { url: IMG(50), order: 1 }],
            sizes: [
              { size: '26', quantity: 18, sku: 'VIIT-WJN-IND-26-001' },
              { size: '28', quantity: 24, sku: 'VIIT-WJN-IND-28-001' },
              { size: '30', quantity: 22, sku: 'VIIT-WJN-IND-30-001' },
              { size: '32', quantity: 16, sku: 'VIIT-WJN-IND-32-001' },
            ],
          },
          {
            colorName: 'Snow White',
            images: [{ url: IMG(51), order: 0 }, { url: IMG(52), order: 1 }],
            sizes: [
              { size: '26', quantity: 12, sku: 'VIIT-WJN-WHT-26-001' },
              { size: '28', quantity: 18, sku: 'VIIT-WJN-WHT-28-001' },
              { size: '30', quantity: 15, sku: 'VIIT-WJN-WHT-30-001' },
            ],
          },
        ],
        badge: null, isFeatured: false, isActive: true,
        ratings: { average: 4.1, count: 89 },
      },
      // ── MAN > Casual > T-Shirt (another one) ──
      {
        category: 'man', subCategory: 'man-casual', subSubCategory: 'tshirt',
        title: 'Acid Wash Graphic Tee',
        slug: slugify('Acid Wash Graphic Tee'),
        description: 'Streetwear-inspired acid wash tee with a bold back graphic print. Made from heavy-weight cotton for a premium, structured drape.',
        price: 1799, sellingPrice: 1499,
        colors: [
          {
            colorName: 'Washed Grey',
            images: [{ url: IMG(53), order: 0 }, { url: IMG(54), order: 1 }],
            sizes: [
              { size: 'S', quantity: 25, sku: 'VIIT-TS-WGR-S-002' },
              { size: 'M', quantity: 35, sku: 'VIIT-TS-WGR-M-002' },
              { size: 'L', quantity: 30, sku: 'VIIT-TS-WGR-L-002' },
              { size: 'XL', quantity: 20, sku: 'VIIT-TS-WGR-XL-002' },
            ],
          },
        ],
        badge: 'Limited', isFeatured: false, isActive: false,
        ratings: { average: 3.8, count: 28 },
      },
      // ── WOMAN > Ethnic (no sub-sub, but still valid product) ──
      {
        category: 'woman', subCategory: 'woman-essentials', subSubCategory: 'tops',
        title: 'Embroidered Peplum Top',
        slug: slugify('Embroidered Peplum Top'),
        description: 'A statement peplum top with intricate thread embroidery along the neckline. The flared hem creates a flattering silhouette for all body types.',
        price: 2299, sellingPrice: 1799,
        colors: [
          {
            colorName: 'Mustard Yellow',
            images: [{ url: IMG(55), order: 0 }, { url: IMG(56), order: 1 }],
            sizes: [
              { size: 'S', quantity: 14, sku: 'VIIT-WT-MUS-S-002' },
              { size: 'M', quantity: 20, sku: 'VIIT-WT-MUS-M-002' },
              { size: 'L', quantity: 16, sku: 'VIIT-WT-MUS-L-002' },
              { size: 'XL', quantity: 10, sku: 'VIIT-WT-MUS-XL-002' },
            ],
          },
          {
            colorName: 'Emerald Green',
            images: [{ url: IMG(57), order: 0 }, { url: IMG(58), order: 1 }],
            sizes: [
              { size: 'S', quantity: 12, sku: 'VIIT-WT-EMR-S-002' },
              { size: 'M', quantity: 18, sku: 'VIIT-WT-EMR-M-002' },
              { size: 'L', quantity: 14, sku: 'VIIT-WT-EMR-L-002' },
            ],
          },
        ],
        badge: null, isFeatured: false, isActive: false,
        ratings: { average: 3.2, count: 12 },
      },
      // ── MAN > Linen > Linen Shirt (another) ──
      {
        category: 'man', subCategory: 'man-linen', subSubCategory: 'shirt',
        title: 'Camp Collar Linen Shirt',
        slug: slugify('Camp Collar Linen Shirt'),
        description: 'Resort-ready camp collar shirt in lightweight Italian linen. Features a relaxed box cut, chest pocket, and coconut shell buttons.',
        price: 3299, sellingPrice: 2799,
        colors: [
          {
            colorName: 'Peach',
            images: [{ url: IMG(59), order: 0 }, { url: IMG(60), order: 1 }],
            sizes: [
              { size: 'S', quantity: 12, sku: 'VIIT-LS-PCH-S-002' },
              { size: 'M', quantity: 18, sku: 'VIIT-LS-PCH-M-002' },
              { size: 'L', quantity: 15, sku: 'VIIT-LS-PCH-L-002' },
              { size: 'XL', quantity: 8, sku: 'VIIT-LS-PCH-XL-002' },
            ],
          },
          {
            colorName: 'Powder Blue',
            images: [{ url: IMG(61), order: 0 }, { url: IMG(62), order: 1 }],
            sizes: [
              { size: 'M', quantity: 14, sku: 'VIIT-LS-PBL-M-002' },
              { size: 'L', quantity: 12, sku: 'VIIT-LS-PBL-L-002' },
              { size: 'XL', quantity: 6, sku: 'VIIT-LS-PBL-XL-002' },
            ],
          },
        ],
        badge: 'New', isFeatured: false, isActive: true,
        ratings: { average: 4.8, count: 19 },
      },
    ];

    // Add 18 extra dummy jackets to check UI UX for /man/man-denim/jacket
    for (let i = 1; i <= 18; i++) {
      productsData.push({
        category: 'man', subCategory: 'man-denim', subSubCategory: 'jacket',
        title: `Test Denim Jacket ${i}`,
        slug: slugify(`Test Denim Jacket ${i}`),
        description: `This is a test denim jacket (${i}) to help check the UI/UX layout. Features standard denim construction.`,
        price: 2999 + i * 100, sellingPrice: 1999 + i * 100,
        colors: [
          {
            colorName: 'Standard Wash',
            images: [{ url: IMG((i % 60) + 1), order: 0 }],
            sizes: [
              { size: 'M', quantity: 10, sku: `TEST-DJ-${i}-M` },
              { size: 'L', quantity: 10, sku: `TEST-DJ-${i}-L` }
            ],
          }
        ],
        badge: i % 4 === 0 ? 'New' : (i % 5 === 0 ? 'Sale' : null), 
        isFeatured: i % 3 === 0, 
        isActive: true,
        ratings: { average: 4.2 + (i % 10) * 0.05, count: i * 8 },
      });
    }

    // Manually generate product IDs since insertMany bypasses pre-save hooks
    const Counter = mongoose.models.Counter ?? mongoose.model('Counter', new mongoose.Schema({ _id: String, seq: Number }));
    const counter = await Counter.findByIdAndUpdate(
      'pro_seq',
      { $inc: { seq: productsData.length } },
      { new: true, upsert: true }
    );
    let startSeq = counter.seq - productsData.length + 1;
    for (const p of productsData) {
      (p as any).productId = `PID_${String(startSeq++).padStart(3, '0')}`;
    }

    const products = await Product.insertMany(productsData);

    // ── 4. Seed Users ─────────────────────────────────────────────
    const usersData = [
      {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@gmail.com',
        mobile: '+919876543210',
        passwordHash: 'SEEDED_HASH_NOT_REAL',
        role: 'admin',
        isVerified: true,
        isActive: true,
        address: [
          {
            label: 'Home',
            fullName: 'Aarav Sharma',
            mobile: '+919876543210',
            line1: '42, Rajpur Road',
            line2: 'Civil Lines',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110054',
            country: 'India',
          },
        ],
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@gmail.com',
        mobile: '+919123456789',
        passwordHash: 'SEEDED_HASH_NOT_REAL',
        role: 'customer',
        isVerified: true,
        isActive: true,
        address: [
          {
            label: 'Home',
            fullName: 'Priya Patel',
            mobile: '+919123456789',
            line1: '15, SG Highway',
            line2: 'Bodakdev',
            city: 'Ahmedabad',
            state: 'Gujarat',
            pincode: '380054',
            country: 'India',
          },
          {
            label: 'Work',
            fullName: 'Priya Patel',
            mobile: '+919123456789',
            line1: '3rd Floor, Titanium City Center',
            city: 'Ahmedabad',
            state: 'Gujarat',
            pincode: '380015',
            country: 'India',
          },
        ],
      },
      {
        name: 'Rohan Mehta',
        email: 'rohan.mehta@outlook.com',
        mobile: '+919988776655',
        passwordHash: 'SEEDED_HASH_NOT_REAL',
        role: 'customer',
        isVerified: true,
        isActive: true,
        address: [
          {
            label: 'Home',
            fullName: 'Rohan Mehta',
            mobile: '+919988776655',
            line1: '88, Linking Road',
            line2: 'Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            country: 'India',
          },
        ],
      },
      {
        name: 'Ananya Krishnan',
        email: 'ananya.k@yahoo.com',
        mobile: '+918877665544',
        passwordHash: 'SEEDED_HASH_NOT_REAL',
        role: 'customer',
        isVerified: true,
        isActive: true,
        address: [
          {
            label: 'Home',
            fullName: 'Ananya Krishnan',
            mobile: '+918877665544',
            line1: '204, 100 Feet Road',
            line2: 'Indiranagar',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560038',
            country: 'India',
          },
          {
            label: 'Work',
            fullName: 'Ananya Krishnan',
            mobile: '+918877665544',
            line1: 'WeWork, Embassy Golf Links',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560071',
            country: 'India',
          },
        ],
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@hotmail.com',
        mobile: '+917766554433',
        passwordHash: 'SEEDED_HASH_NOT_REAL',
        role: 'customer',
        isVerified: true,
        isActive: true,
        address: [
          {
            label: 'Home',
            fullName: 'Vikram Singh',
            mobile: '+917766554433',
            line1: '56, Mall Road',
            line2: 'Near Clock Tower',
            city: 'Dehradun',
            state: 'Uttarakhand',
            pincode: '248001',
            country: 'India',
          },
        ],
      },
    ];

    const users = await User.insertMany(usersData);

    // ── 4b. Seed Cart & Wishlist (separate collections) ───────────
    await Cart.insertMany([
      { userId: users[0]._id, productId: products[0]._id, colorName: 'Indigo Blue', size: 'M', quantity: 1 },
      { userId: users[1]._id, productId: products[8]._id, colorName: 'Blush Pink', size: 'S', quantity: 1 },
      { userId: users[1]._id, productId: products[9]._id, colorName: 'Teal Floral', size: 'M', quantity: 1 },
      { userId: users[4]._id, productId: products[7]._id, colorName: 'Navy Blue', size: 'L', quantity: 2 },
    ]);

    await Wishlist.insertMany([
      { userId: users[0]._id, productId: products[4]._id, colorName: 'Classic White', size: 'L' },
      { userId: users[1]._id, productId: products[11]._id, colorName: 'Light Blue', size: 'M' },
      { userId: users[2]._id, productId: products[2]._id, colorName: 'Mid Blue', size: '32' },
      { userId: users[2]._id, productId: products[6]._id, colorName: 'Black', size: 'L' },
    ]);

    // ── 5. Seed Orders ────────────────────────────────────────────
    const ordersData = [
      // Order 1 — Delivered (Rohan)
      {
        orderId: 'VIIT-2026-00001',
        userId: users[2]._id,
        items: [
          {
            productId: products[0]._id,
            title: 'Classic Indigo Denim Jacket',
            colorName: 'Indigo Blue',
            size: 'L',
            quantity: 1,
            priceAtOrder: 3799,
          },
        ],
        shippingAddress: users[2].address[0],
        pricing: { subtotal: 3799, discount: 0, couponDiscount: 0, shippingFee: 0, tax: 684, total: 4483 },
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        paymentId: 'pay_SEED_001',
        status: 'Delivered',
        timeline: [
          { status: 'Placed', message: 'Order placed successfully', timestamp: new Date('2026-05-20T10:00:00Z') },
          { status: 'Confirmed', message: 'Order confirmed by seller', timestamp: new Date('2026-05-20T12:30:00Z') },
          { status: 'Shipped', message: 'Shipped via Delhivery — AWB 1234567890', timestamp: new Date('2026-05-21T09:00:00Z') },
          { status: 'Delivered', message: 'Delivered to customer', timestamp: new Date('2026-05-24T14:00:00Z') },
        ],
        trackingNumber: 'DLV1234567890',
        deliveryPartner: 'Delhivery',
        estimatedDelivery: new Date('2026-05-25T00:00:00Z'),
        deliveredAt: new Date('2026-05-24T14:00:00Z'),
      },
      // Order 2 — Delivered (Priya)
      {
        orderId: 'VIIT-2026-00002',
        userId: users[1]._id,
        items: [
          {
            productId: products[8]._id,
            title: 'Ruffle Sleeve Crop Top',
            colorName: 'Blush Pink',
            size: 'S',
            quantity: 1,
            priceAtOrder: 1399,
          },
          {
            productId: products[10]._id,
            title: 'Pleated A-Line Midi Skirt',
            colorName: 'Dusty Rose',
            size: 'S',
            quantity: 1,
            priceAtOrder: 1999,
          },
        ],
        shippingAddress: users[1].address[0],
        pricing: { subtotal: 3398, discount: 0, couponDiscount: 200, shippingFee: 0, tax: 576, total: 3774 },
        couponCode: 'NEWUSER',
        paymentMethod: 'Card',
        paymentStatus: 'Paid',
        paymentId: 'pay_SEED_002',
        status: 'Delivered',
        timeline: [
          { status: 'Placed', message: 'Order placed successfully', timestamp: new Date('2026-05-15T18:00:00Z') },
          { status: 'Confirmed', message: 'Order confirmed by seller', timestamp: new Date('2026-05-16T08:00:00Z') },
          { status: 'Shipped', message: 'Shipped via BlueDart — AWB 9876543210', timestamp: new Date('2026-05-17T10:30:00Z') },
          { status: 'Delivered', message: 'Delivered to customer', timestamp: new Date('2026-05-19T16:00:00Z') },
        ],
        trackingNumber: 'BD9876543210',
        deliveryPartner: 'BlueDart',
        estimatedDelivery: new Date('2026-05-20T00:00:00Z'),
        deliveredAt: new Date('2026-05-19T16:00:00Z'),
      },
      // Order 3 — Shipped (Ananya)
      {
        orderId: 'VIIT-2026-00003',
        userId: users[3]._id,
        items: [
          {
            productId: products[9]._id,
            title: 'Floral Midi Wrap Dress',
            colorName: 'Teal Floral',
            size: 'M',
            quantity: 1,
            priceAtOrder: 2799,
          },
        ],
        shippingAddress: users[3].address[0],
        pricing: { subtotal: 2799, discount: 0, couponDiscount: 0, shippingFee: 99, tax: 504, total: 3402 },
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        paymentId: 'pay_SEED_003',
        status: 'Shipped',
        timeline: [
          { status: 'Placed', message: 'Order placed successfully', timestamp: new Date('2026-06-01T09:00:00Z') },
          { status: 'Confirmed', message: 'Order confirmed by seller', timestamp: new Date('2026-06-01T11:00:00Z') },
          { status: 'Shipped', message: 'Shipped via DTDC — AWB 5556667778', timestamp: new Date('2026-06-02T14:00:00Z') },
        ],
        trackingNumber: 'DTDC5556667778',
        deliveryPartner: 'DTDC',
        estimatedDelivery: new Date('2026-06-06T00:00:00Z'),
      },
      // Order 4 — Confirmed (Vikram)
      {
        orderId: 'VIIT-2026-00004',
        userId: users[4]._id,
        items: [
          {
            productId: products[4]._id,
            title: 'Pure Linen Mandarin Collar Shirt',
            colorName: 'Sky Blue',
            size: 'L',
            quantity: 1,
            priceAtOrder: 2499,
          },
          {
            productId: products[5]._id,
            title: 'Linen Relaxed Trousers',
            colorName: 'Sand Beige',
            size: '32',
            quantity: 1,
            priceAtOrder: 2199,
          },
        ],
        shippingAddress: users[4].address[0],
        pricing: { subtotal: 4698, discount: 0, couponDiscount: 500, shippingFee: 0, tax: 756, total: 4954 },
        couponCode: 'SUMMER50',
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        status: 'Confirmed',
        timeline: [
          { status: 'Placed', message: 'Order placed successfully', timestamp: new Date('2026-06-04T20:00:00Z') },
          { status: 'Confirmed', message: 'Order confirmed by seller', timestamp: new Date('2026-06-05T09:00:00Z') },
        ],
      },
      // Order 5 — Placed (Aarav)
      {
        orderId: 'VIIT-2026-00005',
        userId: users[0]._id,
        items: [
          {
            productId: products[6]._id,
            title: 'Oversized Drop Shoulder Tee',
            colorName: 'Charcoal Grey',
            size: 'M',
            quantity: 2,
            priceAtOrder: 1199,
          },
        ],
        shippingAddress: users[0].address[0],
        pricing: { subtotal: 2398, discount: 0, couponDiscount: 0, shippingFee: 0, tax: 432, total: 2830 },
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        paymentId: 'pay_SEED_005',
        status: 'Placed',
        timeline: [
          { status: 'Placed', message: 'Order placed successfully', timestamp: new Date('2026-06-06T08:00:00Z') },
        ],
      },
      // Order 6 — Cancelled (Priya)
      {
        orderId: 'VIIT-2026-00006',
        userId: users[1]._id,
        items: [
          {
            productId: products[12]._id,
            title: 'High Rise Straight Leg Jeans',
            colorName: 'Deep Indigo',
            size: '28',
            quantity: 1,
            priceAtOrder: 2599,
          },
        ],
        shippingAddress: users[1].address[0],
        pricing: { subtotal: 2599, discount: 0, couponDiscount: 0, shippingFee: 99, tax: 468, total: 3166 },
        paymentMethod: 'Card',
        paymentStatus: 'Refunded',
        paymentId: 'pay_SEED_006',
        status: 'Cancelled',
        timeline: [
          { status: 'Placed', message: 'Order placed successfully', timestamp: new Date('2026-05-28T14:00:00Z') },
          { status: 'Confirmed', message: 'Order confirmed by seller', timestamp: new Date('2026-05-28T16:00:00Z') },
          { status: 'Cancelled', message: 'Cancelled by customer — wrong size selected', timestamp: new Date('2026-05-29T09:00:00Z') },
        ],
      },
      // Order 7 — Delivered (Vikram)
      {
        orderId: 'VIIT-2026-00007',
        userId: users[4]._id,
        items: [
          {
            productId: products[2]._id,
            title: 'Slim Fit Washed Jeans',
            colorName: 'Mid Blue',
            size: '32',
            quantity: 1,
            priceAtOrder: 2699,
          },
          {
            productId: products[7]._id,
            title: 'Piqué Cotton Polo',
            colorName: 'Navy Blue',
            size: 'L',
            quantity: 1,
            priceAtOrder: 1599,
          },
        ],
        shippingAddress: users[4].address[0],
        pricing: { subtotal: 4298, discount: 0, couponDiscount: 0, shippingFee: 0, tax: 774, total: 5072 },
        paymentMethod: 'COD',
        paymentStatus: 'Paid',
        status: 'Delivered',
        timeline: [
          { status: 'Placed', message: 'Order placed successfully', timestamp: new Date('2026-05-10T11:00:00Z') },
          { status: 'Confirmed', message: 'Order confirmed by seller', timestamp: new Date('2026-05-10T14:00:00Z') },
          { status: 'Shipped', message: 'Shipped via Delhivery — AWB 1112223334', timestamp: new Date('2026-05-11T10:00:00Z') },
          { status: 'Delivered', message: 'Delivered to customer', timestamp: new Date('2026-05-14T13:00:00Z') },
        ],
        trackingNumber: 'DLV1112223334',
        deliveryPartner: 'Delhivery',
        estimatedDelivery: new Date('2026-05-15T00:00:00Z'),
        deliveredAt: new Date('2026-05-14T13:00:00Z'),
      },
      // Order 8 — Delivered (Ananya)
      {
        orderId: 'VIIT-2026-00008',
        userId: users[3]._id,
        items: [
          {
            productId: products[11]._id,
            title: 'Cropped Denim Jacket',
            colorName: 'Light Blue',
            size: 'M',
            quantity: 1,
            priceAtOrder: 3299,
          },
        ],
        shippingAddress: users[3].address[0],
        pricing: { subtotal: 3299, discount: 0, couponDiscount: 0, shippingFee: 0, tax: 594, total: 3893 },
        paymentMethod: 'Card',
        paymentStatus: 'Paid',
        paymentId: 'pay_SEED_008',
        status: 'Delivered',
        timeline: [
          { status: 'Placed', message: 'Order placed successfully', timestamp: new Date('2026-05-08T15:00:00Z') },
          { status: 'Confirmed', message: 'Order confirmed by seller', timestamp: new Date('2026-05-09T08:00:00Z') },
          { status: 'Shipped', message: 'Shipped via BlueDart — AWB 4445556667', timestamp: new Date('2026-05-10T09:00:00Z') },
          { status: 'Delivered', message: 'Delivered to customer', timestamp: new Date('2026-05-12T12:00:00Z') },
        ],
        trackingNumber: 'BD4445556667',
        deliveryPartner: 'BlueDart',
        estimatedDelivery: new Date('2026-05-13T00:00:00Z'),
        deliveredAt: new Date('2026-05-12T12:00:00Z'),
      },
    ];

    const orders = await Order.insertMany(ordersData);

    // ── 6. Seed Reviews ───────────────────────────────────────────
    // Only for delivered orders (orders[0], orders[1], orders[6], orders[7])
    const reviewsData = [
      {
        productId: products[0]._id,
        userId: users[2]._id,
        orderId: orders[0]._id,
        rating: 5,
        title: 'Absolutely love this jacket!',
        body: 'The quality of the denim is outstanding. Fits perfectly — true to size. The indigo colour is rich and vibrant. Already got compliments at office!',
        images: [],
        colorReviewed: 'Indigo Blue',
        sizeReviewed: 'L',
        isApproved: true,
        helpfulCount: 14,
      },
      {
        productId: products[8]._id,
        userId: users[1]._id,
        orderId: orders[1]._id,
        rating: 4,
        title: 'Pretty top, runs slightly small',
        body: 'Love the ruffle sleeves — very elegant. The fabric is soft and breathable. Ordered S but it feels more like XS. Would suggest sizing up.',
        images: [],
        colorReviewed: 'Blush Pink',
        sizeReviewed: 'S',
        isApproved: true,
        helpfulCount: 8,
      },
      {
        productId: products[10]._id,
        userId: users[1]._id,
        orderId: orders[1]._id,
        rating: 5,
        title: 'Gorgeous skirt!',
        body: 'The pleats are perfectly set and the satin finish looks so luxurious. Paired it with a tucked-in blouse for a wedding reception. Got so many compliments!',
        images: [],
        colorReviewed: 'Dusty Rose',
        sizeReviewed: 'S',
        isApproved: true,
        helpfulCount: 11,
      },
      {
        productId: products[2]._id,
        userId: users[4]._id,
        orderId: orders[6]._id,
        rating: 4,
        title: 'Good jeans, decent stretch',
        body: 'Comfortable fit with good stretch. The wash is nice but the colour faded slightly after the first wash. Overall good value for money.',
        images: [],
        colorReviewed: 'Mid Blue',
        sizeReviewed: '32',
        isApproved: true,
        helpfulCount: 5,
      },
      {
        productId: products[7]._id,
        userId: users[4]._id,
        orderId: orders[6]._id,
        rating: 3,
        title: 'Average quality polo',
        body: 'The fit is good but the collar started curling after a couple of washes. The navy colour is nice though. Expected better quality at this price point.',
        images: [],
        colorReviewed: 'Navy Blue',
        sizeReviewed: 'L',
        isApproved: false,
        helpfulCount: 2,
      },
      {
        productId: products[11]._id,
        userId: users[3]._id,
        orderId: orders[7]._id,
        rating: 5,
        title: 'Perfect cropped jacket',
        body: 'This jacket is exactly what I was looking for. The cropped length is perfect over dresses. The silver hardware adds a nice touch. Worth every rupee!',
        images: [],
        colorReviewed: 'Light Blue',
        sizeReviewed: 'M',
        isApproved: true,
        helpfulCount: 9,
      },
    ];

    await Review.insertMany(reviewsData);

    // ── 7. Seed Coupons ───────────────────────────────────────────
    const couponsData = [
      {
        code: 'VIIT20',
        type: 'percent',
        value: 20,
        minOrderValue: 999,
        applicableTo: 'all',
        usageLimit: 1000,
        usedCount: 47,
        perUserLimit: 3,
        usedBy: [],
        isActive: true,
        expiresAt: new Date('2026-12-31T23:59:59Z'),
      },
      {
        code: 'NEWUSER',
        type: 'flat',
        value: 200,
        minOrderValue: 499,
        applicableTo: 'all',
        usageLimit: 5000,
        usedCount: 312,
        perUserLimit: 1,
        usedBy: [users[1]._id],
        isActive: true,
        expiresAt: new Date('2026-12-31T23:59:59Z'),
      },
      {
        code: 'SUMMER50',
        type: 'percent',
        value: 50,
        minOrderValue: 1499,
        maxDiscount: 500,
        applicableTo: 'all',
        usageLimit: 500,
        usedCount: 89,
        perUserLimit: 1,
        usedBy: [users[4]._id],
        isActive: true,
        expiresAt: new Date('2026-12-31T23:59:59Z'),
      },
    ];

    await Coupon.insertMany(couponsData);

    // ── 8. Return summary ─────────────────────────────────────────
    const counts = {
      subCategories: subCategoryCount,
      products: products.length,
      users: users.length,
      orders: orders.length,
      reviews: reviewsData.length,
      coupons: couponsData.length,
    };

    return Response.json({
      success: true,
      message: '🌱 Database seeded successfully!',
      counts,
    });
  } catch (error) {
    console.error('Seed error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { success: false, message: `Seed failed: ${message}` },
      { status: 500 }
    );
  }
}
