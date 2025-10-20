"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = exports.messageRoutes = exports.authRoutes = exports.serviceRoutes = exports.specialtyRoutes = void 0;
// Shared Routes Index
var specialtyRoutes_1 = require("./specialtyRoutes");
Object.defineProperty(exports, "specialtyRoutes", { enumerable: true, get: function () { return __importDefault(specialtyRoutes_1).default; } });
var serviceRoutes_1 = require("./serviceRoutes");
Object.defineProperty(exports, "serviceRoutes", { enumerable: true, get: function () { return __importDefault(serviceRoutes_1).default; } });
var authRoutes_1 = require("./authRoutes");
Object.defineProperty(exports, "authRoutes", { enumerable: true, get: function () { return __importDefault(authRoutes_1).default; } });
var messageRoutes_1 = require("./messageRoutes");
Object.defineProperty(exports, "messageRoutes", { enumerable: true, get: function () { return __importDefault(messageRoutes_1).default; } });
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "notificationRoutes", { enumerable: true, get: function () { return __importDefault(notifications_1).default; } });
