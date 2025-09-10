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
const scheduleRoutes_1 = __importDefault(require("./scheduleRoutes"));
const serviceRoutes_1 = __importDefault(require("./serviceRoutes"));
const specialtyRoutes_1 = __importDefault(require("./specialtyRoutes"));
const router = (0, express_1.Router)();
// Admin routes
router.use("/auth", authRoutes_1.default);
router.use("/appointments", appointmentRoutes_1.default);
router.use("/users", userRoutes_1.default);
router.use("/schedules", scheduleRoutes_1.default);
router.use("/services", serviceRoutes_1.default);
router.use("/specialties", specialtyRoutes_1.default);
exports.default = router;
