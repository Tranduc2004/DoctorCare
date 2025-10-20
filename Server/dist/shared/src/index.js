"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateError = exports.NotFoundError = exports.ValidationError = exports.MedicineService = exports.CategoryService = exports.StaffService = exports.getMedicineStockModel = exports.getStockTransactionModel = exports.getMedicineBatchModel = exports.getMedicineModel = exports.UnitConverter = exports.getMedicineCategoryModel = exports.medicineCategorySchema = exports.staffSchema = void 0;
var StaffModel_1 = require("./domains/staff/StaffModel");
Object.defineProperty(exports, "staffSchema", { enumerable: true, get: function () { return StaffModel_1.staffSchema; } });
var CategoryModel_1 = require("./domains/category/CategoryModel");
Object.defineProperty(exports, "medicineCategorySchema", { enumerable: true, get: function () { return CategoryModel_1.medicineCategorySchema; } });
Object.defineProperty(exports, "getMedicineCategoryModel", { enumerable: true, get: function () { return CategoryModel_1.getMedicineCategoryModel; } });
var MedicineModel_1 = require("./domains/medicine/MedicineModel");
Object.defineProperty(exports, "UnitConverter", { enumerable: true, get: function () { return MedicineModel_1.UnitConverter; } });
// Export Medicine factory functions
var MedicineModels_1 = require("./models/MedicineModels");
Object.defineProperty(exports, "getMedicineModel", { enumerable: true, get: function () { return MedicineModels_1.getMedicineModel; } });
Object.defineProperty(exports, "getMedicineBatchModel", { enumerable: true, get: function () { return MedicineModels_1.getMedicineBatchModel; } });
Object.defineProperty(exports, "getStockTransactionModel", { enumerable: true, get: function () { return MedicineModels_1.getStockTransactionModel; } });
Object.defineProperty(exports, "getMedicineStockModel", { enumerable: true, get: function () { return MedicineModels_1.getMedicineStockModel; } });
// Export centralized services for shared business logic
var StaffService_1 = require("./services/StaffService");
Object.defineProperty(exports, "StaffService", { enumerable: true, get: function () { return StaffService_1.StaffService; } });
var CategoryService_1 = require("./services/CategoryService");
Object.defineProperty(exports, "CategoryService", { enumerable: true, get: function () { return CategoryService_1.CategoryService; } });
var MedicineService_1 = require("./services/MedicineService");
Object.defineProperty(exports, "MedicineService", { enumerable: true, get: function () { return MedicineService_1.MedicineService; } });
// Common error classes
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class DuplicateError extends Error {
    constructor(message) {
        super(message);
        this.name = "DuplicateError";
    }
}
exports.DuplicateError = DuplicateError;
