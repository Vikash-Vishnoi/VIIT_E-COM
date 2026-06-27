import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId;
  label: 'Home' | 'Work' | 'Other';
  fullName: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Standard guard — prevents model re-compilation on hot-reload
const Address: Model<IAddress> =
  (mongoose.models.Address as Model<IAddress>) ?? mongoose.model<IAddress>('Address', AddressSchema);

export default Address;
