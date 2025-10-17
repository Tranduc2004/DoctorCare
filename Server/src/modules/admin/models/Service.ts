import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
  description: string;
  price: number;
  duration: number; // thời gian khám (phút)
  imageUrl?: string; // URL ảnh từ Cloudinary
  imagePublicId?: string; // Public ID để xóa ảnh từ Cloudinary
  thumbnailUrl?: string; // URL thumbnail
  included?: string[]; // Những gì bao gồm trong dịch vụ
  excluded?: string[]; // Những gì không bao gồm trong dịch vụ
  preparation?: string; // Hướng dẫn chuẩn bị trước khám
  aftercare?: string; // Hướng dẫn chăm sóc sau khám
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      default: 30,
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
    included: {
      type: [String],
      required: false,
      default: [],
    },
    excluded: {
      type: [String],
      required: false,
      default: [],
    },
    preparation: {
      type: String,
      required: false,
      trim: true,
    },
    aftercare: {
      type: String,
      required: false,
      trim: true,
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
ServiceSchema.index({ name: "text", description: "text" });

export default mongoose.model<IService>("Service", ServiceSchema);
