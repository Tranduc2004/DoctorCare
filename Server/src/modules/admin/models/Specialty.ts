import mongoose, { Schema, Document } from "mongoose";

export interface ISpecialty extends Document {
  name: string;
  description: string;
  imageUrl?: string; // URL ảnh từ Cloudinary
  imagePublicId?: string; // Public ID để xóa ảnh từ Cloudinary
  thumbnailUrl?: string; // URL thumbnail
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialtySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    imagePublicId: {
      type: String,
      required: false,
    },
    thumbnailUrl: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
SpecialtySchema.index({ name: "text", description: "text" });

export default mongoose.model<ISpecialty>("Specialty", SpecialtySchema);
