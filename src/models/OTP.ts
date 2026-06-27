import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;       // stored as SHA-256 hash, never plaintext
  attempts: number;
  sendCount: number;
  isLocked: boolean;
  lockedUntil?: Date;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email:    { type: String, required: true, index: true },
    otp:      { type: String, required: true }, // SHA-256 hash of the OTP
    attempts: { type: Number, default: 0 },
    sendCount: { type: Number, default: 1 },
    isLocked: { type: Boolean, default: false },
    lockedUntil: { type: Date },
    createdAt: { type: Date, default: Date.now, expires: '30m' }, // TTL — auto-deleted after 30 minutes (handles lock expiration)
  },
);

// Standard guard — prevents model re-compilation on hot-reload
const OTP: Model<IOTP> =
  (mongoose.models.OTP as Model<IOTP>) ?? mongoose.model<IOTP>('OTP', OTPSchema);

export default OTP;
