// Re-export types and interfaces from Staff domain (NO BUSINESS LOGIC)
export type {
  IStaff,
  StaffStatus,
  StaffRole,
  CreateStaffDTO,
  UpdateStaffDTO,
  StaffQuery,
} from "./domains/staff/StaffModel";
export { staffSchema } from "./domains/staff/StaffModel";

// Export MedicineCategory types and interfaces
export type {
  IMedicineCategory,
  CategoryStatus,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryQuery,
} from "./domains/category/CategoryModel";
export {
  medicineCategorySchema,
  getMedicineCategoryModel,
} from "./domains/category/CategoryModel";

// Export Medicine types and interfaces
export type {
  IMedicine,
  IMedicineBatch,
  IStockTransaction,
  IMedicineStock,
  MedicineStatus,
  MedicineUnit,
  TransactionType,
  PackagingSpec,
  UnitConversion,
  CreateMedicineDTO,
  MedicineImportDTO,
  MedicineQuery,
} from "./domains/medicine/MedicineModel";
export { UnitConverter } from "./domains/medicine/MedicineModel";

// Export Medicine factory functions
export {
  getMedicineModel,
  getMedicineBatchModel,
  getStockTransactionModel,
  getMedicineStockModel,
} from "./models/MedicineModels";

// Export centralized services for shared business logic
export { StaffService } from "./services/StaffService";
export { CategoryService } from "./services/CategoryService";
export { MedicineService } from "./services/MedicineService";

// Common types and utilities can be added here
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Common error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateError";
  }
}
