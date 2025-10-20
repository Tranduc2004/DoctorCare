import { Schema, Connection, Document } from "mongoose";

// MedicineCategory interface
export interface IMedicineCategory extends Document {
  _id: string;
  name: string;
  description?: string;
  code: string; // Mã danh mục (unique)
  isActive: boolean;

  // Tracking information
  createdBy: string; // Staff ID who created this category
  createdByName: string; // Staff name for display
  createdByRole: "admin" | "staff"; // Role of creator
  approvedBy?: string; // Admin ID who approved (if needed)
  approvedAt?: Date;
  status: "pending" | "approved" | "rejected";
  rejectedReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// MedicineCategory schema
export const medicineCategorySchema = new Schema<IMedicineCategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    code: {
      type: String,
      required: [true, "Category code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "Category code cannot exceed 20 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Tracking fields
    createdBy: {
      type: String,
      required: [true, "Creator ID is required"],
    },
    createdByName: {
      type: String,
      required: [true, "Creator name is required"],
    },
    createdByRole: {
      type: String,
      enum: ["admin", "staff"],
      required: [true, "Creator role is required"],
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectedReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
medicineCategorySchema.index({ status: 1 });
medicineCategorySchema.index({ createdBy: 1 });
medicineCategorySchema.index({ isActive: 1 });

// ✅ Factory function
export function getMedicineCategoryModel(conn: Connection) {
  return conn.model<IMedicineCategory>(
    "MedicineCategory",
    medicineCategorySchema
  );
}

// Types for API
export type CategoryStatus = "pending" | "approved" | "rejected";

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  code: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CategoryQuery {
  status?: CategoryStatus;
  createdByRole?: "admin" | "staff";
  createdBy?: string; // Add filter by creator ID
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
