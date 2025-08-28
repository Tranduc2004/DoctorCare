"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Doctor: Quản lý lịch hẹn của mình
router.get("/", controllers_1.getDoctorAppointments);
router.get("/by-date", controllers_1.getAppointmentsByDate);
router.get("/stats", controllers_1.getAppointmentStats);
router.put("/status/:id", controllers_1.updateAppointmentStatus);
exports.default = router;
