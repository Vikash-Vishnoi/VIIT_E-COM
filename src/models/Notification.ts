import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NotificationType =
  | 'order_update'      // order status changed
  | 'back_in_stock'     // a wishlisted item is available again
  | 'coupon'            // new coupon issued to user
  | 'review_approved';  // user's review was approved by admin

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;  // deep link e.g. '/orders/VIIT-2026-00421'
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['order_update', 'back_in_stock', 'coupon', 'review_approved'],
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  {
    // Only createdAt — notifications are never "updated", just read/deleted
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'notifications',
  }
);

// Fetch unread notifications for a user efficiently
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
