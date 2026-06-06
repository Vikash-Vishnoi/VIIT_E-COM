import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ─── Sub-schemas ───────────────────────────────────────────────────

const AddressSchema = new Schema(
  {
    label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: true }
);

const CartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    colorName: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WishlistItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    colorName: { type: String, required: true },
    size: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Main interface ────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  address: {
    _id: Types.ObjectId;
    label: string;
    fullName: string;
    mobile: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  }[];
  cart: {
    productId: Types.ObjectId;
    colorName: string;
    size: string;
    quantity: number;
    addedAt: Date;
  }[];
  wishlist: {
    productId: Types.ObjectId;
    colorName: string;
    size: string;
    addedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// ─── Main schema ───────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },

    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    address: { type: [AddressSchema], default: [] },
    cart: { type: [CartItemSchema], default: [] },
    wishlist: { type: [WishlistItemSchema], default: [] },

    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// ─── Indexes ───────────────────────────────────────────────────────
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ mobile: 1 }, { unique: true });
UserSchema.index({ role: 1 });

// ─── Prevent model re-compilation in dev hot-reload ───────────────
const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export default User;
