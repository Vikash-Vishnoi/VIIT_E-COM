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

const RatingsSchema = new Schema(
  {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ColorSchema = new Schema(
  {
    colorName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    images: { type: [ImageSchema], default: [] },
    sizes: { type: [SizeSchema], default: [] },
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
  minSellingPrice: number;
  maxSellingPrice: number;
  colors: {
    colorName: string;
    price: number;
    sellingPrice: number;
    images: { url: string; order: number }[];
    sizes: { size: string; quantity: number; sku: string }[];
    badge?: string;
    isFeatured: boolean;
    isActive: boolean;
    ratings: { average: number; count: number };
    popularityScore: number;
  }[];
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

    minSellingPrice: { type: Number, default: 0 },
    maxSellingPrice: { type: Number, default: 0 },

    colors: { type: [ColorSchema], required: true },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
    collection: 'products',
  }
);
//minSellingPrice indexing
ProductSchema.index({ minSellingPrice: 1 });

// The 3-Tier Feed Algorithm Indexes (Zero In-Memory Sorts)
ProductSchema.index({ 'colors.isActive': 1, category: 1, 'colors.popularityScore': -1 });
ProductSchema.index({ 'colors.isActive': 1, category: 1, subCategory: 1, 'colors.popularityScore': -1 });
ProductSchema.index({ 'colors.isActive': 1, category: 1, subCategory: 1, subSubCategory: 1, 'colors.popularityScore': -1 });

// Full-Text Search Index
ProductSchema.index({ title: 'text', description: 'text' });

// ─── Pre-Validate Hook for Bulk SKU, ID, and Slug Generation ────────
ProductSchema.pre('validate', async function () {
  const Counter = mongoose.models.Counter || mongoose.model('Counter');

  // 1. Generate Slug
  if (this.isModified('title') || this.isNew) {
    if (this.title) {
      let baseSlug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existing = await mongoose.model('Product').findOne({ slug: baseSlug, _id: { $ne: this._id } }).select('_id').lean();
      if (existing) {
        baseSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }
      this.slug = baseSlug;
    }
  }

  // 2. Generate Product ID
  if (this.isNew && !this.productId) {
    const counter = await Counter.findByIdAndUpdate(
      'pro_seq',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.productId = `VIIT-${new Date().getFullYear()}-${String(counter.seq).padStart(4, '0')}`;
  }

  // 3. Generate missing SKUs
  if (this.isModified('colors') || this.isNew) {
    let missingSkusCount = 0;
    this.colors?.forEach(c => {
      c.sizes?.forEach(s => {
        if (!s.sku) missingSkusCount++;
      });
    });

    if (missingSkusCount > 0) {
      const counter = await Counter.findByIdAndUpdate(
        'sku_seq',
        { $inc: { seq: missingSkusCount } },
        { new: true, upsert: true }
      );

      let currentSeq = counter.seq - missingSkusCount + 1;

      const getInitials = (str: string) => (str || '').trim().split(/\s+/).map(w => w[0]?.toUpperCase()).join('').slice(0, 3);
      const t = getInitials(this.title || 'PRD');

      this.colors?.forEach(c => {
        const cInitials = getInitials(c.colorName || 'COL');
        c.sizes?.forEach(s => {
          if (!s.sku) {
            const sInitials = (s.size || 'SZ').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const seqStr = String(currentSeq++).padStart(4, '0');
            s.sku = `VIIT-${t}-${cInitials}-${sInitials}-${seqStr}`;
          }
        });
      });
    }
  }
});

// ─── Pre-save Hook for Auto-Incrementing Score ───────
ProductSchema.pre('save', async function () {
  const daysSinceCreated = (Date.now() - (this.createdAt ? this.createdAt.getTime() : Date.now())) / 86400000;
  
  // Calculate popularityScore for each color variant
  this.colors?.forEach(color => {
    let score = 0;
    if (color.isFeatured) score += 100;
    
    if (color.badge === 'Best Seller') score += 50;
    else if (color.badge === 'New') score += 40;
    else if (color.badge === 'Limited') score += 35;
    else if (color.badge === 'Sale') score += 30;

    const avg = color.ratings?.average || 0;
    const count = color.ratings?.count || 0;
    score += (avg / 5) * 25 * Math.min(count / 30, 1);

    score += Math.max(0, 35 - daysSinceCreated);

    color.popularityScore = Math.round(score * 10) / 10;
  });

  const sellingPrices = this.colors?.map(c => c.sellingPrice) ?? [0];
  this.minSellingPrice = sellingPrices.length ? Math.min(...sellingPrices) : 0;
  this.maxSellingPrice = sellingPrices.length ? Math.max(...sellingPrices) : 0;
});

// ─── Prevent model re-compilation in dev hot-reload ───────────────
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}
const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
