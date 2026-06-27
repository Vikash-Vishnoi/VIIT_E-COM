import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  applicableTo: 'all' | 'category' | 'product';
  categoryFilter?: string;
  productIds?: Types.ObjectId[];
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  usedBy: Types.ObjectId[];
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, required: true, enum: ['percent', 'flat'] },
    value: { type: Number, required: true, min: 0 }, // 20 (%) or 200 (₹)
    minOrderValue: { type: Number, required: true, min: 0, default: 0 },
    maxDiscount: { type: Number }, // cap for percent coupons

    applicableTo: { type: String, required: true, enum: ['all', 'category', 'product'], default: 'all' },
    categoryFilter: { type: String },              // 'MAN' | 'WOMAN' etc.
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

    usageLimit: { type: Number, required: true, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'coupons',
  }
);

// code unique index handled by schema definition
CouponSchema.index({ isActive: 1, expiresAt: 1 });

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon ?? mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
