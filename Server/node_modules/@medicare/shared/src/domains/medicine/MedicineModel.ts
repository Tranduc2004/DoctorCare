import { Document } from "mongoose";

/**
 * Medicine Unit Types - viên là đơn vị gốc
 */
export type MedicineUnit = "viên" | "vỉ" | "hộp" | "thùng";

/**
 * Quy cách đóng gói - conversion rates to tablets (viên)
 */
export interface PackagingSpec {
  tabletsPerStrip: number; // Số viên trong 1 vỉ
  stripsPerBox: number; // Số vỉ trong 1 hộp
  boxesPerCarton: number; // Số hộp trong 1 thùng
}

/**
 * Unit conversion helper
 */
export interface UnitConversion {
  unit: MedicineUnit;
  quantity: number;
  equivalentTablets: number; // Số viên tương đương
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
  code: string; // Mã thuốc duy nhất
  barcode?: string;

  // Category & Classification
  categoryId: string;
  categoryName: string;

  // Packaging Specifications - QUY CÁCH ĐÓNG GÓI
  packaging: PackagingSpec;

  // Medicine Information
  activeIngredient: string; // Hoạt chất
  concentration: string; // Nồng độ (VD: 500mg)
  dosageForm: string; // Dạng bào chế (viên nén, viên nang, etc.)

  // Supplier & Manufacturer
  manufacturer: string;
  supplier?: string;
  country?: string;

  // Prescription Requirements
  requiresPrescription: boolean;

  // Storage & Safety
  storageConditions?: string;
  contraindications?: string[];
  sideEffects?: string[];

  // Status & Metadata
  status: MedicineStatus;
  isActive: boolean;
  rejectedReason?: string;

  // Audit Fields
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

  // Batch Information
  batchNumber: string; // Số lô
  manufacturingDate: Date;
  expiryDate: Date;

  // Inventory (TẤT CẢ ĐỀU TÍNH THEO VIÊN)
  totalQuantity: number; // Tổng số viên trong lô
  availableQuantity: number; // Số viên còn lại
  reservedQuantity: number; // Số viên đã đặt/chờ xuất

  // Cost Information (THEO VIÊN)
  costPerTablet: number; // Giá vốn mỗi viên
  sellingPricePerTablet?: number; // Giá bán mỗi viên

  // Purchase Information
  purchaseDate: Date;
  purchasePrice: number; // Giá mua của toàn bộ lô
  purchaseUnit: MedicineUnit; // Đơn vị mua vào
  purchaseQuantity: number; // Số lượng mua theo đơn vị

  // Status
  status: "active" | "expired" | "recalled" | "depleted";

  // Audit
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Stock Transaction (Lịch sử xuất nhập kho)
 */
export type TransactionType =
  | "import"
  | "export"
  | "adjustment"
  | "expired"
  | "damaged";

export interface IStockTransaction extends Document {
  _id: string;
  medicineId: string;
  medicineName: string;
  medicineCode: string;
  batchId?: string;
  batchNumber?: string;

  // Transaction Details
  type: TransactionType;
  quantity: number; // SỐ VIÊN (luôn luôn là viên)
  unit: MedicineUnit; // Đơn vị giao dịch gốc
  originalQuantity: number; // Số lượng theo đơn vị gốc

  // Cost Information
  costPerTablet?: number;
  totalCost?: number;

  // Reference Information
  referenceType?:
    | "purchase_order"
    | "sale_order"
    | "prescription"
    | "adjustment";
  referenceId?: string;

  // Transaction Context
  reason?: string;
  notes?: string;

  // Balance After Transaction (THEO VIÊN)
  balanceAfter: number;

  // Audit
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

  // Current Stock (TẤT CẢ THEO VIÊN)
  totalQuantity: number; // Tổng tồn kho
  availableQuantity: number; // Có thể bán
  reservedQuantity: number; // Đã đặt hàng

  // Stock Levels
  minStockLevel: number; // Mức tồn kho tối thiểu
  maxStockLevel: number; // Mức tồn kho tối đa
  reorderLevel: number; // Mức đặt hàng lại

  // Cost Information
  averageCostPerTablet: number; // Giá vốn trung bình mỗi viên
  totalStockValue: number; // Giá trị tồn kho

  // Status
  stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "overstock";

  // Last Updated
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

  // Packaging Specs
  packaging: PackagingSpec;

  // Medicine Info
  activeIngredient: string;
  concentration: string;
  dosageForm: string;
  manufacturer: string;
  supplier?: string;
  country?: string;
  requiresPrescription: boolean;

  // Storage & Safety
  storageConditions?: string;
  contraindications?: string[];
  sideEffects?: string[];

  // Optional stock levels
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

  // Import details
  quantity: number;
  unit: MedicineUnit;
  costPerUnit: number; // Giá theo đơn vị nhập

  // Optional
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
export class UnitConverter {
  /**
   * Convert any unit to tablets based on packaging specs
   */
  static toTablets(
    quantity: number,
    unit: MedicineUnit,
    packaging: PackagingSpec
  ): number {
    switch (unit) {
      case "viên":
        return quantity;
      case "vỉ":
        return quantity * packaging.tabletsPerStrip;
      case "hộp":
        return quantity * packaging.stripsPerBox * packaging.tabletsPerStrip;
      case "thùng":
        return (
          quantity *
          packaging.boxesPerCarton *
          packaging.stripsPerBox *
          packaging.tabletsPerStrip
        );
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
  }

  /**
   * Convert tablets to any unit based on packaging specs
   */
  static fromTablets(
    tablets: number,
    unit: MedicineUnit,
    packaging: PackagingSpec
  ): number {
    switch (unit) {
      case "viên":
        return tablets;
      case "vỉ":
        return tablets / packaging.tabletsPerStrip;
      case "hộp":
        return tablets / (packaging.stripsPerBox * packaging.tabletsPerStrip);
      case "thùng":
        return (
          tablets /
          (packaging.boxesPerCarton *
            packaging.stripsPerBox *
            packaging.tabletsPerStrip)
        );
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
  }

  /**
   * Get conversion rate for a unit
   */
  static getConversionRate(
    unit: MedicineUnit,
    packaging: PackagingSpec
  ): number {
    return this.toTablets(1, unit, packaging);
  }

  /**
   * Validate packaging specifications
   */
  static validatePackaging(packaging: PackagingSpec): boolean {
    return (
      packaging.tabletsPerStrip > 0 &&
      packaging.stripsPerBox > 0 &&
      packaging.boxesPerCarton > 0
    );
  }

  /**
   * Format quantity display with appropriate unit
   */
  static formatQuantity(tablets: number, packaging: PackagingSpec): string {
    const cartons = Math.floor(
      tablets /
        (packaging.boxesPerCarton *
          packaging.stripsPerBox *
          packaging.tabletsPerStrip)
    );
    const remainingAfterCartons =
      tablets %
      (packaging.boxesPerCarton *
        packaging.stripsPerBox *
        packaging.tabletsPerStrip);

    const boxes = Math.floor(
      remainingAfterCartons /
        (packaging.stripsPerBox * packaging.tabletsPerStrip)
    );
    const remainingAfterBoxes =
      remainingAfterCartons %
      (packaging.stripsPerBox * packaging.tabletsPerStrip);

    const strips = Math.floor(remainingAfterBoxes / packaging.tabletsPerStrip);
    const remainingTablets = remainingAfterBoxes % packaging.tabletsPerStrip;

    const parts: string[] = [];
    if (cartons > 0) parts.push(`${cartons} thùng`);
    if (boxes > 0) parts.push(`${boxes} hộp`);
    if (strips > 0) parts.push(`${strips} vỉ`);
    if (remainingTablets > 0) parts.push(`${remainingTablets} viên`);

    return parts.length > 0 ? parts.join(" + ") : "0 viên";
  }
}
