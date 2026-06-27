import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IInventoryLog extends Document {
  productId: Types.ObjectId;
  sku: string;
  changeType: 'restock' | 'sale' | 'return' | 'adjustment';
  quantityChange: number;
  quantityAfter: number;
  reference?: string;
  createdAt: Date;
}

const InventoryLogSchema = new Schema<IInventoryLog>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    changeType: {
      type: String,
      required: true,
      enum: ['restock', 'sale', 'return', 'adjustment'],
    },
    quantityChange: { type: Number, required: true }, // positive = added, negative = removed
    quantityAfter: { type: Number, required: true, min: 0 },
    reference: { type: String },                      // Order ID or admin note
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'inventory_logs',
  }
);

InventoryLogSchema.index({ productId: 1, sku: 1, createdAt: -1 });
InventoryLogSchema.index({ changeType: 1, createdAt: -1 });

const InventoryLog: Model<IInventoryLog> =
  mongoose.models.InventoryLog ??
  mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema);

export default InventoryLog;
