"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Admin: Quản lý tất cả lịch hẹn
router.get("/", controllers_1.getAllAppointments);
router.get("/stats", controllers_1.getAppointmentStats);
router.put("/status/:id", controllers_1.updateAppointmentStatus);
router.delete("/:id", controllers_1.deleteAppointment);
exports.default = router;
