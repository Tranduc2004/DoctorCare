"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = exports.specialtyRoutes = void 0;
// Shared Routes Index
var specialtyRoutes_1 = require("./specialtyRoutes");
Object.defineProperty(exports, "specialtyRoutes", { enumerable: true, get: function () { return __importDefault(specialtyRoutes_1).default; } });
var authRoutes_1 = require("./authRoutes");
Object.defineProperty(exports, "authRoutes", { enumerable: true, get: function () { return __importDefault(authRoutes_1).default; } });
