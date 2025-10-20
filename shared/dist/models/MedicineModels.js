"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMedicineModel = getMedicineModel;
exports.getMedicineBatchModel = getMedicineBatchModel;
exports.getStockTransactionModel = getStockTransactionModel;
exports.getMedicineStockModel = getMedicineStockModel;
const mongoose_1 = require("mongoose");
const medicineSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    barcode: { type: String, trim: true },
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    packaging: {
        tabletsPerStrip: { type: Number, required: true, min: 1 },
        stripsPerBox: { type: Number, required: true, min: 1 },
        boxesPerCarton: { type: Number, required: true, min: 1 },
    },
    activeIngredient: { type: String, required: true, trim: true },
    concentration: { type: String, required: true, trim: true },
    dosageForm: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    supplier: { type: String, trim: true },
    country: { type: String, trim: true },
    requiresPrescription: { type: Boolean, default: false },
    storageConditions: { type: String, trim: true },
    contraindications: [{ type: String, trim: true }],
    sideEffects: [{ type: String, trim: true }],
    status: {
        type: String,
        enum: ["active", "inactive", "discontinued", "pending"],
        default: "active",
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
    createdByRole: { type: String, enum: ["admin", "staff"], required: true },
    updatedBy: { type: String },
    updatedByName: { type: String },
    updatedAt: { type: Date },
}, { timestamps: true });
medicineSchema.index({ categoryId: 1 });
medicineSchema.index({ name: "text", activeIngredient: "text" });
const medicineBatchSchema = new mongoose_1.Schema({
    medicineId: { type: String, required: true },
    medicineName: { type: String, required: true },
    medicineCode: { type: String, required: true },
    batchNumber: { type: String, required: true, trim: true },
    manufacturingDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    totalQuantity: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    costPerTablet: { type: Number, required: true, min: 0 },
    sellingPricePerTablet: { type: Number, min: 0 },
    purchaseDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    purchaseUnit: {
        type: String,
        enum: ["viên", "vỉ", "hộp", "thùng"],
        required: true,
    },
    purchaseQuantity: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ["active", "expired", "recalled", "depleted"],
        default: "active",
    },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
}, { timestamps: true });
const stockTransactionSchema = new mongoose_1.Schema({
    medicineId: { type: String, required: true },
    medicineName: { type: String, required: true },
    medicineCode: { type: String, required: true },
    batchId: { type: String },
    batchNumber: { type: String },
    type: {
        type: String,
        enum: ["import", "export", "adjustment", "expired", "damaged"],
        required: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ["viên", "vỉ", "hộp", "thùng"], required: true },
    originalQuantity: { type: Number, required: true },
    costPerTablet: { type: Number, min: 0 },
    totalCost: { type: Number, min: 0 },
    referenceType: {
        type: String,
        enum: ["purchase_order", "sale_order", "prescription", "adjustment"],
    },
    referenceId: { type: String },
    reason: { type: String },
    notes: { type: String },
    balanceAfter: { type: Number, required: true },
    performedBy: { type: String, required: true },
    performedByName: { type: String, required: true },
    performedByRole: { type: String, enum: ["admin", "staff"], required: true },
    performedAt: { type: Date, required: true },
});
const medicineStockSchema = new mongoose_1.Schema({
    medicineId: { type: String, required: true, unique: true },
    medicineName: { type: String, required: true },
    medicineCode: { type: String, required: true },
    totalQuantity: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    maxStockLevel: { type: Number, default: 1000, min: 0 },
    reorderLevel: { type: Number, default: 50, min: 0 },
    averageCostPerTablet: { type: Number, required: true, min: 0 },
    totalStockValue: { type: Number, required: true, min: 0 },
    stockStatus: {
        type: String,
        enum: ["in_stock", "low_stock", "out_of_stock", "overstock"],
        default: "in_stock",
    },
    lastUpdated: { type: Date, default: Date.now },
    lastUpdatedBy: { type: String, required: true },
    lastUpdatedByName: { type: String, required: true },
});
// ✅ Factory functions
function getMedicineModel(conn) {
    return conn.model("Medicine", medicineSchema);
}
function getMedicineBatchModel(conn) {
    return conn.model("MedicineBatch", medicineBatchSchema);
}
function getStockTransactionModel(conn) {
    return conn.model("StockTransaction", stockTransactionSchema);
}
function getMedicineStockModel(conn) {
    return conn.model("MedicineStock", medicineStockSchema);
}
//# sourceMappingURL=MedicineModels.js.map