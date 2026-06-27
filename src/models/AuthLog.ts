import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthLog extends Document {
  email: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'ACCOUNT_LOCKED' | 'REGISTER' | 'PASSWORD_CHANGED' | 'LOGOUT';
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuthLogSchema = new Schema<IAuthLog>(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    action: { 
      type: String, 
      enum: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'REGISTER', 'PASSWORD_CHANGED', 'LOGOUT'], 
      required: true 
    },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now, expires: '90d' }, // Automatically delete after 90 days
  }
);

// Standard guard — prevents model re-compilation on hot-reload
const AuthLog: Model<IAuthLog> =
  (mongoose.models.AuthLog as Model<IAuthLog>) ?? mongoose.model<IAuthLog>('AuthLog', AuthLogSchema);

export default AuthLog;
