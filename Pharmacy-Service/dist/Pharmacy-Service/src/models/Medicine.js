"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicineStockModel = exports.StockTransactionModel = exports.MedicineBatchModel = exports.MedicineModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const shared_1 = require("@medicare/shared");
exports.MedicineModel = (0, shared_1.getMedicineModel)(mongoose_1.default.connection);
exports.MedicineBatchModel = (0, shared_1.getMedicineBatchModel)(mongoose_1.default.connection);
exports.StockTransactionModel = (0, shared_1.getStockTransactionModel)(mongoose_1.default.connection);
exports.MedicineStockModel = (0, shared_1.getMedicineStockModel)(mongoose_1.default.connection);
//# sourceMappingURL=Medicine.js.map