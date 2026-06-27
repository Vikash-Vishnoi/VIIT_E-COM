import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ─── Main interface ────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
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

    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// ─── Indexes ───────────────────────────────────────────────────────
UserSchema.index({ email: 1 }, { unique: true });

// ─── Prevent model re-compilation in dev hot-reload ───────────────
const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export default User;
