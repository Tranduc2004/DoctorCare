"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Patient: Xem hồ sơ bệnh án của mình
router.get("/", controllers_1.getPatientMedicalRecords);
router.get("/history", controllers_1.getPatientHistory);
router.get("/:id", controllers_1.getMedicalRecordDetail);
exports.default = router;
