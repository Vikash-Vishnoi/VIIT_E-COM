import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICounter {
  _id: string; // The name of the sequence, e.g., 'pro_seq'
  seq: number; // The current sequence number
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

// ─── Prevent model re-compilation in dev hot-reload ───────────────
const Counter: Model<ICounter> =
  mongoose.models.Counter ?? mongoose.model<ICounter>('Counter', CounterSchema);

export default Counter;
