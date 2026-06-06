import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Sub-schemas ───────────────────────────────────────────────────

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const SizeSchema = new Schema(
  {
    size: { type: String, required: true },   // 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '28' | '30' …
    quantity: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, required: true },     // 'VIIT-DJ-IND-M-001'
  },
  { _id: false }
);

const ColorSchema = new Schema(
  {
    colorName: { type: String, required: true },
    images: { type: [ImageSchema], default: [] },
    sizes: { type: [SizeSchema], default: [] },
  },
  { _id: false }
);

const RatingsSchema = new Schema(
  {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// ─── Main interface ────────────────────────────────────────────────

export interface IProduct extends Document {
  category: string;
  subCategory: string;
  subSubCategory?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  sellingPrice: number;
  colors: {
    colorName: string;
    images: { url: string; order: number }[];
    sizes: { size: string; quantity: number; sku: string }[];
  }[];
  badge?: string;
  isFeatured: boolean;
  isActive: boolean;
  ratings: { average: number; count: number };
  createdAt: Date;
  updatedAt: Date;
}

// ─── Main schema ───────────────────────────────────────────────────

const ProductSchema = new Schema<IProduct>(
  {
    category: {
      type: String,
      required: true,
      enum: ['MAN', 'WOMAN', 'KIDS', 'ACCESSORIES'],
    },
    subCategory: { type: String, required: true, trim: true },
    subSubCategory: { type: String, trim: true },

    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },

    price: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },

    colors: { type: [ColorSchema], required: true },

    badge: {
      type: String,
      enum: ['New', 'Sale', 'Best Seller', 'Limited', null],
      default: null,
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    ratings: { type: RatingsSchema, default: () => ({ average: 0, count: 0 }) },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
    collection: 'products',
  }
);

// ─── Indexes ───────────────────────────────────────────────────────
ProductSchema.index({ category: 1 });
ProductSchema.index({ subCategory: 1 });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ sellingPrice: 1 });
ProductSchema.index({ 'ratings.average': -1 });

// ─── Prevent model re-compilation in dev hot-reload ───────────────
const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
