"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Admin Routes Index
const express_1 = require("express");
const appointmentRoutes_1 = __importDefault(require("./appointmentRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const router = (0, express_1.Router)();
// Admin routes
router.use("/auth", authRoutes_1.default);
router.use("/appointments", appointmentRoutes_1.default);
router.use("/users", userRoutes_1.default);
exports.default = router;
