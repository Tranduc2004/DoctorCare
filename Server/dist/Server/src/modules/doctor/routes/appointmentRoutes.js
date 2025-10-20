"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Doctor: Quản lý lịch hẹn của mình
router.get("/", controllers_1.getDoctorAppointments);
router.get("/by-date", controllers_1.getAppointmentsByDate);
router.get("/stats", controllers_1.getAppointmentStats);
router.put("/:appointmentId/status", controllers_1.updateAppointmentStatus);
// Doctor requests a reschedule (provide newScheduleId)
router.post("/:appointmentId/request-reschedule", controllers_1.requestReschedule);
// Doctor accepts patient's reschedule selection (or confirms)
router.post("/:appointmentId/accept-reschedule", controllers_1.acceptReschedule);
exports.default = router;
