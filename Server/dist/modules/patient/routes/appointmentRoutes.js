"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Patient: Quản lý lịch hẹn của mình
router.post("/", controllers_1.createAppointment);
router.get("/", controllers_1.getPatientAppointments);
router.put("/cancel/:id", controllers_1.cancelAppointment);
router.put("/symptoms/:id", controllers_1.updateSymptoms);
exports.default = router;
