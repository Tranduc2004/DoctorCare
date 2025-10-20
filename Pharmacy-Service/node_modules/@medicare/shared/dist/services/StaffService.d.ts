import { StaffQuery, CreateStaffDTO } from "../index";
/**
 * Centralized Staff Service
 * Provides business logic for both Main Server and Pharmacy-Service
 * Eliminates code duplication and ensures consistency
 */
export declare class StaffService {
    /**
     * Get all staff with pagination and filtering
     */
    static getAllStaff(staffModel: any, query: StaffQuery): Promise<{
        staff: any;
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: any;
            itemsPerPage: number;
        };
    }>;
    /**
     * Get staff by ID
     */
    static getStaffById(staffModel: any, id: string): Promise<any>;
    /**
     * Create new staff (registration)
     */
    static createStaff(staffModel: any, data: CreateStaffDTO): Promise<any>;
    /**
     * Login staff
     */
    static loginStaff(staffModel: any, email: string, password: string): Promise<any>;
    /**
     * Approve staff
     */
    static approveStaff(staffModel: any, id: string, adminId?: string): Promise<any>;
    /**
     * Reject staff
     */
    static rejectStaff(staffModel: any, id: string, reason: string, adminId?: string): Promise<any>;
    /**
     * Update staff status (active/inactive)
     */
    static updateStaffStatus(staffModel: any, id: string, active: boolean): Promise<any>;
    /**
     * Update staff role
     */
    static updateStaffRole(staffModel: any, id: string, role: "admin" | "staff"): Promise<any>;
    /**
     * Delete staff
     */
    static deleteStaff(staffModel: any, id: string): Promise<boolean>;
    /**
     * Get staff statistics
     */
    static getStaffStats(staffModel: any): Promise<{
        total: any;
        byStatus: any;
        byRole: any;
    }>;
}
//# sourceMappingURL=StaffService.d.ts.map