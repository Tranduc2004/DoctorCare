"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Doctor Routes Index
const express_1 = require("express");
const scheduleRoutes_1 = __importDefault(require("./scheduleRoutes"));
const appointmentRoutes_1 = __importDefault(require("./appointmentRoutes"));
const medicalRecordRoutes_1 = __importDefault(require("./medicalRecordRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const doctorRoutes_1 = __importDefault(require("./doctorRoutes"));
const router = (0, express_1.Router)();
// Doctor routes
router.use("/auth", authRoutes_1.default);
router.use("/schedule", scheduleRoutes_1.default);
router.use("/appointments", appointmentRoutes_1.default);
router.use("/medical-records", medicalRecordRoutes_1.default);
router.use("/doctors", doctorRoutes_1.default);
exports.default = router;
