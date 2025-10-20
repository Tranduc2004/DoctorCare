import { Schema, Document, Connection } from "mongoose";
export interface IStaff extends Document {
    _id: string;
    name: string;
    email: string;
    password: string;
    role: "admin" | "staff";
    active: boolean;
    status: "pending" | "approved" | "rejected";
    approvedBy?: string;
    approvedAt?: Date;
    rejectedReason?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const staffSchema: Schema<IStaff, import("mongoose").Model<IStaff, any, any, any, Document<unknown, any, IStaff, any, {}> & IStaff & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IStaff, Document<unknown, {}, import("mongoose").FlatRecord<IStaff>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IStaff> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export { staffSchema };
export declare const createStaffModel: (connection?: Connection) => import("mongoose").Model<IStaff, {}, {}, {}, Document<unknown, {}, IStaff, {}, {}> & IStaff & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export declare const Staff: import("mongoose").Model<IStaff, {}, {}, {}, Document<unknown, {}, IStaff, {}, {}> & IStaff & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export type StaffStatus = "pending" | "approved" | "rejected";
export type StaffRole = "admin" | "staff";
export interface CreateStaffDTO {
    name: string;
    email: string;
    password: string;
    role?: StaffRole;
}
export interface UpdateStaffDTO {
    name?: string;
    email?: string;
    role?: StaffRole;
    active?: boolean;
    status?: StaffStatus;
    approvedBy?: string;
    approvedAt?: Date;
    rejectedReason?: string;
}
export interface StaffQuery {
    status?: StaffStatus;
    role?: StaffRole;
    active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
//# sourceMappingURL=StaffModel.d.ts.map