import mongoose, { Document, Schema } from "mongoose";

export interface IMedicine extends Document {
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  unit: string;
  unitPrice: number;
  stock: number;
  minimumStock: number;
  expiryDate: Date;
  batchNumber: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema(
  {
    name: { type: String, required: true },
    genericName: { type: String, required: true },
    category: { type: String, required: true },
    manufacturer: { type: String, required: true },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    minimumStock: { type: Number, required: true, default: 10 },
    expiryDate: { type: Date, required: true },
    batchNumber: { type: String, required: true },
    location: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMedicine>("Medicine", MedicineSchema);
