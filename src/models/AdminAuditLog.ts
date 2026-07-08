import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAdminAuditLog extends Document {
  adminId: Types.ObjectId;         // Which admin performed the action
  action: 'PRODUCT_DELETED' | 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'USER_UPDATED' | 'CATEGORY_CREATED' | 'CATEGORY_UPDATED' | 'CATEGORY_DELETED' | 'PRODUCT_STATUS_UPDATED' | 'INVENTORY_ADJUSTED' | 'ORDER_UPDATED' | 'FILE_UPLOADED';
  resourceId: string;              // MongoDB _id of the affected document
  resourceName?: string;            // Human-readable label (e.g. product title)
  metadata: Record<string, unknown>; // Key field snapshot at the time of the action
  createdAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: ['PRODUCT_DELETED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'USER_UPDATED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'PRODUCT_STATUS_UPDATED', 'INVENTORY_ADJUSTED', 'ORDER_UPDATED', 'FILE_UPLOADED'],
    },
    resourceId:   { type: String, required: true, index: true },
    resourceName: { type: String },
    metadata:     { type: Schema.Types.Mixed, default: {} },
    // TTL — automatically purge logs older than 180 days
    createdAt:    { type: Date, default: Date.now, expires: '180d' },
  },
  {
    collection: 'admin_audit_logs',
  }
);

AdminAuditLogSchema.index({ action: 1, createdAt: -1 });
AdminAuditLogSchema.index({ adminId: 1, createdAt: -1 });

// Standard guard — prevents model re-compilation on hot-reload
const AdminAuditLog: Model<IAdminAuditLog> =
  (mongoose.models.AdminAuditLog as Model<IAdminAuditLog>) ??
  mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);

export default AdminAuditLog;
