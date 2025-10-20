import { Schema, Connection, Document } from "mongoose";
export interface IMedicineCategory extends Document {
    _id: string;
    name: string;
    description?: string;
    code: string;
    isActive: boolean;
    createdBy: string;
    createdByName: string;
    createdByRole: "admin" | "staff";
    approvedBy?: string;
    approvedAt?: Date;
    status: "pending" | "approved" | "rejected";
    rejectedReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const medicineCategorySchema: Schema<IMedicineCategory, import("mongoose").Model<IMedicineCategory, any, any, any, Document<unknown, any, IMedicineCategory, any, {}> & IMedicineCategory & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IMedicineCategory, Document<unknown, {}, import("mongoose").FlatRecord<IMedicineCategory>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IMedicineCategory> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export declare function getMedicineCategoryModel(conn: Connection): import("mongoose").Model<IMedicineCategory, {}, {}, {}, Document<unknown, {}, IMedicineCategory, {}, {}> & IMedicineCategory & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export type CategoryStatus = "pending" | "approved" | "rejected";
export interface CreateCategoryDTO {
    name: string;
    description?: string;
    code: string;
}
export interface UpdateCategoryDTO {
    name?: string;
    description?: string;
    isActive?: boolean;
}
export interface CategoryQuery {
    status?: CategoryStatus;
    createdByRole?: "admin" | "staff";
    createdBy?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
//# sourceMappingURL=CategoryModel.d.ts.map