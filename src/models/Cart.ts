import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ─── Interface ─────────────────────────────────────────────────────

export interface ICart extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  colorName: string;
  size: string;
  quantity: number;
  addedAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    colorName: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'carts',
  }
);

// ─── Indexes ───────────────────────────────────────────────────────
// Unique compound: same user can't add same product+color+size twice
CartSchema.index({ userId: 1, productId: 1, colorName: 1, size: 1 }, { unique: true });
CartSchema.index({ userId: 1 });

// ─── Prevent model re-compilation in dev hot-reload ───────────────
const Cart: Model<ICart> =
  mongoose.models.Cart ?? mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
