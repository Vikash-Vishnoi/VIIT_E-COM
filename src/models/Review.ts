import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReview extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  title: string;
  body: string;
  images: string[];
  colorReviewed: string;
  sizeReviewed: string;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true }, // verified buyers only

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true },
    images: { type: [String], default: [] }, // Cloudinary URLs

    colorReviewed: { type: String, required: true },
    sizeReviewed: { type: String, required: true },

    isApproved: { type: Boolean, default: false }, // admin must approve
    helpfulCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // only createdAt needed
    collection: 'reviews',
  }
);

// One review per user per order item
ReviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, isApproved: 1 });
ReviewSchema.index({ rating: -1 });

const Review: Model<IReview> =
  mongoose.models.Review ?? mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
