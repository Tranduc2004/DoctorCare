export type { IStaff, StaffStatus, StaffRole, CreateStaffDTO, UpdateStaffDTO, StaffQuery, } from "./domains/staff/StaffModel";
export { staffSchema } from "./domains/staff/StaffModel";
export type { IMedicineCategory, CategoryStatus, CreateCategoryDTO, UpdateCategoryDTO, CategoryQuery, } from "./domains/category/CategoryModel";
export { medicineCategorySchema, getMedicineCategoryModel, } from "./domains/category/CategoryModel";
export type { IMedicine, IMedicineBatch, IStockTransaction, IMedicineStock, MedicineStatus, MedicineUnit, TransactionType, PackagingSpec, UnitConversion, CreateMedicineDTO, MedicineImportDTO, MedicineQuery, } from "./domains/medicine/MedicineModel";
export { UnitConverter } from "./domains/medicine/MedicineModel";
export { getMedicineModel, getMedicineBatchModel, getStockTransactionModel, getMedicineStockModel, } from "./models/MedicineModels";
export { StaffService } from "./services/StaffService";
export { CategoryService } from "./services/CategoryService";
export { MedicineService } from "./services/MedicineService";
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
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class NotFoundError extends Error {
    constructor(message: string);
}
export declare class DuplicateError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=index.d.ts.map