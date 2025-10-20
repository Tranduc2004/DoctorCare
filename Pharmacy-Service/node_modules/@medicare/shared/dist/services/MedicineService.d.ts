import { IMedicine, IMedicineBatch, IStockTransaction, IMedicineStock, CreateMedicineDTO, MedicineImportDTO, MedicineQuery, PackagingSpec } from "../domains/medicine/MedicineModel";
/**
 * Centralized Medicine Service
 * Xử lý logic nghiệp vụ thuốc và tồn kho theo đúng quy trình kho thuốc
 * VIÊN LÀ ĐƠN VỊ GỐC - TẤT CẢ TÍNH TOÁN DỰA TRÊN VIÊN
 */
export declare class MedicineService {
    /**
     * Kiểm tra thuốc tồn tại theo mã
     */
    static getMedicineByCode(medicineModel: any, code: string): Promise<IMedicine | null>;
    /**
     * Validate packaging specifications
     */
    static validatePackaging(packaging: PackagingSpec): void;
    /**
     * So sánh quy cách đóng gói - đảm bảo consistency
     */
    static comparePackaging(existing: PackagingSpec, incoming: PackagingSpec): boolean;
    /**
     * Tạo thuốc mới
     */
    static createMedicine(medicineModel: any, stockModel: any, data: CreateMedicineDTO, creatorId: string, creatorName: string, creatorRole: "admin" | "staff", categoryModel?: any): Promise<IMedicine>;
    /**
     * Nhập hàng - Logic nghiệp vụ chính
     */
    static importStock(medicineModel: any, batchModel: any, stockModel: any, transactionModel: any, importData: MedicineImportDTO, staffId: string, staffName: string): Promise<{
        medicine: IMedicine;
        batch: IMedicineBatch;
        transaction: IStockTransaction;
        stock: IMedicineStock;
    }>;
    /**
     * Lấy danh sách thuốc với phân trang và filter
     */
    static getAllMedicines(medicineModel: any, query: MedicineQuery): Promise<{
        medicines: any;
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: any;
            itemsPerPage: number;
        };
    }>;
    /**
     * Lấy tồn kho của thuốc
     */
    static getMedicineStock(stockModel: any, medicineId: string): Promise<IMedicineStock>;
    /**
     * Lấy danh sách lô hàng của thuốc
     */
    static getMedicineBatches(batchModel: any, medicineId: string): Promise<any>;
    /**
     * Lấy lịch sử giao dịch
     */
    static getTransactionHistory(transactionModel: any, medicineId?: string, limit?: number): Promise<any>;
    /**
     * Lấy thống kê tồn kho
     */
    static getStockStatistics(stockModel: any, medicineModel: any): Promise<{
        totalMedicines: any;
        totalStockValue: any;
        stockByStatus: any;
        medicinesByStatus: any;
    }>;
    /**
     * Kiểm tra thuốc hết hạn sắp đến
     */
    static getExpiringMedicines(batchModel: any, daysFromNow?: number): Promise<any>;
    /**
     * Kiểm tra thuốc sắp hết hàng
     */
    static getLowStockMedicines(stockModel: any): Promise<any>;
    /**
     * Format hiển thị số lượng theo đơn vị thích hợp
     */
    static formatQuantityDisplay(tablets: number, packaging: PackagingSpec): string;
    /**
     * Tính giá trị tồn kho
     */
    static calculateStockValue(quantity: number, costPerTablet: number): number;
    /**
     * Cập nhật thuốc
     */
    static updateMedicine(medicineModel: any, medicineId: string, updateData: Partial<CreateMedicineDTO>, updaterId: string, updaterName: string): Promise<IMedicine>;
    /**
     * Xóa thuốc (soft delete)
     */
    static deleteMedicine(medicineModel: any, medicineId: string, deleterId: string, deleterName: string): Promise<{
        id: string;
    }>;
}
//# sourceMappingURL=MedicineService.d.ts.map