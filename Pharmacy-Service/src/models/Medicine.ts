import mongoose from "mongoose";
import {
  getMedicineModel,
  getMedicineBatchModel,
  getStockTransactionModel,
  getMedicineStockModel,
} from "@medicare/shared";

// Tạo models từ connection của pharmacy server này
export const MedicineModel = getMedicineModel(mongoose.connection);
export const MedicineBatchModel = getMedicineBatchModel(mongoose.connection);
export const StockTransactionModel = getStockTransactionModel(
  mongoose.connection
);
export const MedicineStockModel = getMedicineStockModel(mongoose.connection);

// Export types để sử dụng trong controller
export type {
  IMedicine,
  IMedicineBatch,
  IStockTransaction,
  IMedicineStock,
} from "@medicare/shared";
