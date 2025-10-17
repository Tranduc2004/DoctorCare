"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Patient: Quản lý lịch hẹn của mình
router.post("/", controllers_1.createAppointment);
router.get("/", controllers_1.getPatientAppointments);
router.get("/history", controllers_1.getAppointmentHistory);
router.put("/cancel/:id", controllers_1.cancelAppointment);
router.put("/symptoms/:id", controllers_1.updateSymptoms);
// Doctor requests extension for an appointment
router.post("/:id/extend", controllers_1.extendAppointment);
// Patient responds to extension consent request
router.post("/:nextId/extension-consent", controllers_1.extensionConsent);
// Check-in by patient or doctor
router.post("/:id/checkin", controllers_1.checkinAppointment);
// Patient proposes reschedule (send 1-5 alternative slots)
router.post("/:id/reschedule-propose", controllers_1.reschedulePropose);
// Patient accepts a reschedule proposed by doctor (or confirms a new slot)
router.post("/:id/reschedule-accept", controllers_1.rescheduleAccept);
exports.default = router;
