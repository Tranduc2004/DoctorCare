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
const insuranceRoutes_1 = __importDefault(require("./insuranceRoutes"));
const medicalRecordRoutes_1 = __importDefault(require("./medicalRecordRoutes"));
const bankAccountRoutes_1 = __importDefault(require("./bankAccountRoutes"));
const paymentAdminRoutes_1 = __importDefault(require("./paymentAdminRoutes"));
const staffRoutes_1 = __importDefault(require("../../pharmacy/routes/staffRoutes"));
const categoryRoutes_1 = __importDefault(require("./categoryRoutes"));
const medicineRoutes_1 = __importDefault(require("./medicineRoutes"));
const router = (0, express_1.Router)();
// Admin routes
router.use("/auth", authRoutes_1.default);
router.use("/appointments", appointmentRoutes_1.default);
router.use("/users", userRoutes_1.default);
router.use("/schedules", scheduleRoutes_1.default);
router.use("/services", serviceRoutes_1.default);
router.use("/specialties", specialtyRoutes_1.default);
router.use("/insurance", insuranceRoutes_1.default);
router.use("/medical-records", medicalRecordRoutes_1.default);
router.use("/bank-accounts", bankAccountRoutes_1.default);
router.use("/payments", paymentAdminRoutes_1.default);
router.use("/pharmacy", staffRoutes_1.default);
router.use("/categories", categoryRoutes_1.default);
router.use("/medicines", medicineRoutes_1.default);
exports.default = router;
