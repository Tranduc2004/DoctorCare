import mongoose from "mongoose";
import { getMedicineCategoryModel } from "@medicare/shared";

// Tạo model từ connection của server này
export const CategoryModel = getMedicineCategoryModel(mongoose.connection);

// Export type để sử dụng trong controller
export type { IMedicineCategory } from "@medicare/shared";
