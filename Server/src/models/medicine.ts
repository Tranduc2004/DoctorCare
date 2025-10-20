import mongoose from "mongoose";
import { getMedicineModel, getMedicineStockModel } from "@medicare/shared";

// Tạo models từ connection của admin server này
export const MedicineModel = getMedicineModel(mongoose.connection);
export const MedicineStockModel = getMedicineStockModel(mongoose.connection);

// Export types để sử dụng trong controller
export type { IMedicine, IMedicineStock } from "@medicare/shared";
