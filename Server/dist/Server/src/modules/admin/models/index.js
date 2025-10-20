"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicineStockModel = exports.MedicineModel = exports.CategoryModel = exports.Specialty = exports.Service = exports.Admin = void 0;
var Admin_1 = require("./Admin");
Object.defineProperty(exports, "Admin", { enumerable: true, get: function () { return __importDefault(Admin_1).default; } });
var Service_1 = require("./Service");
Object.defineProperty(exports, "Service", { enumerable: true, get: function () { return __importDefault(Service_1).default; } });
var Specialty_1 = require("./Specialty");
Object.defineProperty(exports, "Specialty", { enumerable: true, get: function () { return __importDefault(Specialty_1).default; } });
var models_1 = require("../../../models");
Object.defineProperty(exports, "CategoryModel", { enumerable: true, get: function () { return models_1.CategoryModel; } });
var models_2 = require("../../../models");
Object.defineProperty(exports, "MedicineModel", { enumerable: true, get: function () { return models_2.MedicineModel; } });
Object.defineProperty(exports, "MedicineStockModel", { enumerable: true, get: function () { return models_2.MedicineStockModel; } });
