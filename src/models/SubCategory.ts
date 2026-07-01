import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISubCategory extends Document {
  slug: string;
  label: string;
  /**
   * parentId is null/undefined for top-level categories (MAN, WOMAN, KIDS, ACCESSORIES).
   * For sub-categories (Denim, Linen …) it points to the top-level category.
   * For sub-sub-categories (Denim Jacket, Denim Jeans …) it points to the sub-category.
   */
  parentId?: Types.ObjectId;
  /**
   * 0 = top-level  (MAN)
   * 1 = sub        (Denim)
   * 2 = sub-sub    (Denim Jacket)
   */
  level: 0 | 1 | 2;

  isActive: boolean;
  sortOrder: number;  // controls display order within the same parent
  createdAt: Date;
  updatedAt: Date;
}

const SubCategorySchema = new Schema<ISubCategory>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    label: { type: String, required: true, trim: true }, // e.g. "DENIM" or "Denim Jacket"
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'SubCategory',
      default: null,
    },
    level: {
      type: Number,
      required: true,
      enum: [0, 1, 2],
    },

    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'sub_categories',
  }
);

// Fast lookup: get all children of a parent, ordered by sortOrder
SubCategorySchema.index({ parentId: 1, isActive: 1, sortOrder: 1 });
SubCategorySchema.index({ level: 1 });

const SubCategory: Model<ISubCategory> =
  mongoose.models.SubCategory ??
  mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);

export default SubCategory;
