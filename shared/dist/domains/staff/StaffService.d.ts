import { IStaff, CreateStaffDTO, UpdateStaffDTO, StaffQuery } from "./StaffModel";
export declare class StaffService {
    static createStaff(staffData: CreateStaffDTO): Promise<IStaff>;
    static getAllStaff(query?: StaffQuery): Promise<{
        staff: (import("mongoose").Document<unknown, {}, IStaff, {}, {}> & IStaff & Required<{
            _id: string;
        }> & {
            __v: number;
        })[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }>;
    static getStaffById(id: string): Promise<IStaff | null>;
    static getStaffByEmail(email: string): Promise<IStaff | null>;
    static updateStaff(id: string, updateData: UpdateStaffDTO): Promise<IStaff | null>;
    static approveStaff(id: string, approvedBy: string): Promise<IStaff | null>;
    static rejectStaff(id: string, rejectedReason: string, rejectedBy: string): Promise<IStaff | null>;
    static toggleStaffStatus(id: string, active: boolean): Promise<IStaff | null>;
    static updateStaffRole(id: string, role: "admin" | "staff"): Promise<IStaff | null>;
    static deleteStaff(id: string): Promise<boolean>;
    static getStaffStats(): Promise<{
        total: number;
        byStatus: any;
        byRole: any;
    }>;
}
//# sourceMappingURL=StaffService.d.ts.map