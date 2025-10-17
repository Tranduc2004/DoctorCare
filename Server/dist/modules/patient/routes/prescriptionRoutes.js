"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prescriptionController_1 = require("../controllers/prescriptionController");
const router = (0, express_1.Router)();
// Patient: Xem đơn thuốc của mình
router.get("/", prescriptionController_1.getPatientPrescriptions);
router.get("/search", prescriptionController_1.searchPrescriptions);
router.get("/date-range", prescriptionController_1.getPrescriptionsByDateRange);
router.get("/status", prescriptionController_1.getPrescriptionsByStatus);
router.get("/:prescriptionId", prescriptionController_1.getPrescriptionDetail);
exports.default = router;
