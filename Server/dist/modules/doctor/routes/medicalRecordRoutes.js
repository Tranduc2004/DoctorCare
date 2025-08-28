"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Doctor: Quản lý hồ sơ bệnh án
router.post("/", controllers_1.createMedicalRecord);
router.get("/my", controllers_1.getDoctorMedicalRecords);
router.get("/patient/:patientId", controllers_1.getPatientMedicalRecords);
router.get("/:id", controllers_1.getMedicalRecordDetail);
router.put("/:id", controllers_1.updateMedicalRecord);
exports.default = router;
