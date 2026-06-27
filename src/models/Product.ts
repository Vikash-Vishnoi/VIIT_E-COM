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
    sku: { type: String, required: true, unique: true },     // 'VIIT-DJ-IND-M-001'
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
  productId: string;
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
  popularityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Main schema ───────────────────────────────────────────────────

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, unique: true, sparse: true },
    category: {
      type: String,
      required: true,
    },
    subCategory: { type: String, required: true, trim: true },
    subSubCategory: { type: String, required: true, trim: true },

    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },

    price: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },

    colors: { type: [ColorSchema], required: true },

    badge: {
      type: String,
      enum: ['New', 'Sale', 'Best Seller', 'Limited', '', null],
      default: null,
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    ratings: { type: RatingsSchema, default: () => ({ average: 0, count: 0 }) },
    popularityScore: { type: Number, default: 0 },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
    collection: 'products',
  }
);
//selling price indexing
ProductSchema.index({ sellingPrice: 1 });

// The 3-Tier Feed Algorithm Indexes (Zero In-Memory Sorts)
ProductSchema.index({ isActive: 1, category: 1, popularityScore: -1 });
ProductSchema.index({ isActive: 1, category: 1, subCategory: 1, popularityScore: -1 });
ProductSchema.index({ isActive: 1, category: 1, subCategory: 1, subSubCategory: 1, popularityScore: -1 });

// Full-Text Search Index
ProductSchema.index({ title: 'text', description: 'text' });

// ─── Pre-save Hook for Auto-Incrementing Product ID & Score ───────
ProductSchema.pre('save', async function () {
  if (this.isNew && !this.productId) {
    const Counter = mongoose.model('Counter');
    const counter = await Counter.findByIdAndUpdate(
      'pro_seq',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    // Format: PID_001
    this.productId = `PID_${String(counter.seq).padStart(3, '0')}`;
  }

  // Calculate initial popularityScore for the feed algorithm
  let score = 0;
  if (this.isFeatured) score += 100;
  
  if (this.badge === 'Best Seller') score += 50;
  else if (this.badge === 'New') score += 40;
  else if (this.badge === 'Limited') score += 35;
  else if (this.badge === 'Sale') score += 30;

  const avg = this.ratings?.average || 0;
  const count = this.ratings?.count || 0;
  score += (avg / 5) * 25 * Math.min(count / 30, 1);

  const daysSinceCreated = (Date.now() - (this.createdAt ? this.createdAt.getTime() : Date.now())) / 86400000;
  score += Math.max(0, 35 - daysSinceCreated);

  this.popularityScore = Math.round(score * 10) / 10;
});

// ─── Prevent model re-compilation in dev hot-reload ───────────────
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}
const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
