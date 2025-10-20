"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicineCategorySchema = void 0;
exports.getMedicineCategoryModel = getMedicineCategoryModel;
const mongoose_1 = require("mongoose");
// MedicineCategory schema
exports.medicineCategorySchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes
exports.medicineCategorySchema.index({ status: 1 });
exports.medicineCategorySchema.index({ createdBy: 1 });
exports.medicineCategorySchema.index({ isActive: 1 });
// ✅ Factory function
function getMedicineCategoryModel(conn) {
    return conn.model("MedicineCategory", exports.medicineCategorySchema);
}
