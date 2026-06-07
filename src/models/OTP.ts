import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  attempts: number;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: '5m' }, // Automatically deletes document after 5 minutes
  }
);

if (mongoose.models.OTP) {
  delete mongoose.models.OTP;
}

const OTP: Model<IOTP> = mongoose.model<IOTP>('OTP', OTPSchema);
export default OTP;
