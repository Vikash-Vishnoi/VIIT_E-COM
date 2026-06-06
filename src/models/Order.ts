import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ─── Sub-schemas ───────────────────────────────────────────────────

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },       // snapshot at order time
    colorName: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtOrder: { type: Number, required: true }, // locked — never changes
  },
  { _id: false }
);

const PricingSchema = new Schema(
  {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const TimelineEventSchema = new Schema(
  {
    status: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Main interface ────────────────────────────────────────────────

export interface IOrder extends Document {
  orderId: string;
  userId: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    title: string;
    colorName: string;
    size: string;
    quantity: number;
    priceAtOrder: number;
  }[];
  shippingAddress: Record<string, unknown>;
  pricing: {
    subtotal: number;
    discount: number;
    couponDiscount: number;
    shippingFee: number;
    tax: number;
    total: number;
  };
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  status: string;
  timeline: { status: string; message: string; timestamp: Date }[];
  trackingNumber?: string;
  deliveryPartner?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Main schema ───────────────────────────────────────────────────

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true }, // 'VIIT-2026-00421'
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    items: { type: [OrderItemSchema], required: true },

    shippingAddress: { type: Schema.Types.Mixed, required: true }, // copy of address object

    pricing: { type: PricingSchema, required: true },

    couponCode: { type: String },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['UPI', 'Card', 'COD'],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Paid', 'Refunded', 'Failed'],
      default: 'Pending',
    },
    paymentId: { type: String },

    status: {
      type: String,
      required: true,
      enum: ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Placed',
    },

    timeline: { type: [TimelineEventSchema], default: [] },

    trackingNumber: { type: String },
    deliveryPartner: { type: String },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

// ─── Indexes ───────────────────────────────────────────────────────
OrderSchema.index({ orderId: 1 }, { unique: true });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
