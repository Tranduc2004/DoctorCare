import { Document } from "mongoose";
/**
 * Medicine Unit Types - viên là đơn vị gốc
 */
export type MedicineUnit = "viên" | "vỉ" | "hộp" | "thùng";
/**
 * Quy cách đóng gói - conversion rates to tablets (viên)
 */
export interface PackagingSpec {
    tabletsPerStrip: number;
    stripsPerBox: number;
    boxesPerCarton: number;
}
/**
 * Unit conversion helper
 */
export interface UnitConversion {
    unit: MedicineUnit;
    quantity: number;
    equivalentTablets: number;
}
/**
 * Medicine Status
 */
export type MedicineStatus = "active" | "inactive" | "discontinued" | "pending";
/**
 * Medicine Document Interface
 */
export interface IMedicine extends Document {
    _id: string;
    name: string;
    genericName?: string;
    code: string;
    barcode?: string;
    categoryId: string;
    categoryName: string;
    packaging: PackagingSpec;
    activeIngredient: string;
    concentration: string;
    dosageForm: string;
    manufacturer: string;
    supplier?: string;
    country?: string;
    requiresPrescription: boolean;
    storageConditions?: string;
    contraindications?: string[];
    sideEffects?: string[];
    status: MedicineStatus;
    isActive: boolean;
    rejectedReason?: string;
    createdBy: string;
    createdByName: string;
    createdByRole: "admin" | "staff";
    updatedBy?: string;
    updatedByName?: string;
    updatedAt?: Date;
    createdAt: Date;
}
/**
 * Medicine Batch (Lô hàng)
 */
export interface IMedicineBatch extends Document {
    _id: string;
    medicineId: string;
    medicineName: string;
    medicineCode: string;
    batchNumber: string;
    manufacturingDate: Date;
    expiryDate: Date;
    totalQuantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    costPerTablet: number;
    sellingPricePerTablet?: number;
    purchaseDate: Date;
    purchasePrice: number;
    purchaseUnit: MedicineUnit;
    purchaseQuantity: number;
    status: "active" | "expired" | "recalled" | "depleted";
    createdBy: string;
    createdByName: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Stock Transaction (Lịch sử xuất nhập kho)
 */
export type TransactionType = "import" | "export" | "adjustment" | "expired" | "damaged";
export interface IStockTransaction extends Document {
    _id: string;
    medicineId: string;
    medicineName: string;
    medicineCode: string;
    batchId?: string;
    batchNumber?: string;
    type: TransactionType;
    quantity: number;
    unit: MedicineUnit;
    originalQuantity: number;
    costPerTablet?: number;
    totalCost?: number;
    referenceType?: "purchase_order" | "sale_order" | "prescription" | "adjustment";
    referenceId?: string;
    reason?: string;
    notes?: string;
    balanceAfter: number;
    performedBy: string;
    performedByName: string;
    performedByRole: "admin" | "staff";
    performedAt: Date;
}
/**
 * Medicine Stock Summary (Tồn kho tổng hợp)
 */
export interface IMedicineStock extends Document {
    _id: string;
    medicineId: string;
    medicineName: string;
    medicineCode: string;
    totalQuantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    minStockLevel: number;
    maxStockLevel: number;
    reorderLevel: number;
    averageCostPerTablet: number;
    totalStockValue: number;
    stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "overstock";
    lastUpdated: Date;
    lastUpdatedBy: string;
    lastUpdatedByName: string;
}
/**
 * DTO for creating medicine
 */
export interface CreateMedicineDTO {
    name: string;
    genericName?: string;
    code: string;
    barcode?: string;
    categoryId: string;
    categoryName?: string;
    packaging: PackagingSpec;
    activeIngredient: string;
    concentration: string;
    dosageForm: string;
    manufacturer: string;
    supplier?: string;
    country?: string;
    requiresPrescription: boolean;
    storageConditions?: string;
    contraindications?: string[];
    sideEffects?: string[];
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderLevel?: number;
}
/**
 * DTO for medicine stock import
 */
export interface MedicineImportDTO {
    medicineId: string;
    batchNumber: string;
    manufacturingDate: Date;
    expiryDate: Date;
    quantity: number;
    unit: MedicineUnit;
    costPerUnit: number;
    notes?: string;
}
/**
 * Medicine Query Interface
 */
export interface MedicineQuery {
    search?: string;
    categoryId?: string;
    status?: MedicineStatus;
    requiresPrescription?: boolean;
    manufacturer?: string;
    stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
    expiryWithinDays?: number;
    createdBy?: string;
    createdByRole?: "admin" | "staff";
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
/**
 * Unit Conversion Utilities
 */
export declare class UnitConverter {
    /**
     * Convert any unit to tablets based on packaging specs
     */
    static toTablets(quantity: number, unit: MedicineUnit, packaging: PackagingSpec): number;
    /**
     * Convert tablets to any unit based on packaging specs
     */
    static fromTablets(tablets: number, unit: MedicineUnit, packaging: PackagingSpec): number;
    /**
     * Get conversion rate for a unit
     */
    static getConversionRate(unit: MedicineUnit, packaging: PackagingSpec): number;
    /**
     * Validate packaging specifications
     */
    static validatePackaging(packaging: PackagingSpec): boolean;
    /**
     * Format quantity display with appropriate unit
     */
    static formatQuantity(tablets: number, packaging: PackagingSpec): string;
}
//# sourceMappingURL=MedicineModel.d.ts.map