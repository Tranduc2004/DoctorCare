"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const shared_1 = require("@medicare/shared");
// Tạo model từ connection của server này
exports.CategoryModel = (0, shared_1.getMedicineCategoryModel)(mongoose_1.default.connection);
