import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ─── Interface ─────────────────────────────────────────────────────

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  addedAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'wishlists',
  }
);

// ─── Indexes ───────────────────────────────────────────────────────
// Fast lookup for user's wishlist page
WishlistSchema.index({ userId: 1 });

// Unique compound: same user can't wishlist same product twice
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

// ─── Prevent model re-compilation in dev hot-reload ───────────────
const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist ?? mongoose.model<IWishlist>('Wishlist', WishlistSchema);

export default Wishlist; 
