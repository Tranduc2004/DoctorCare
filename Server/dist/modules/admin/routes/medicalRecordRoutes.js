"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medicalRecordController_1 = require("../controllers/medicalRecordController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
// Apply admin auth middleware to all routes
router.use(adminAuth_1.adminAuth);
// Get all medical records with filters and pagination
router.get("/", medicalRecordController_1.getAllMedicalRecords);
// Get medical records statistics
router.get("/stats", medicalRecordController_1.getMedicalRecordsStats);
// Get medical records by patient
router.get("/patient/:patientId", medicalRecordController_1.getMedicalRecordsByPatient);
// Get medical records by doctor
router.get("/doctor/:doctorId", medicalRecordController_1.getMedicalRecordsByDoctor);
// Get specific medical record by ID
router.get("/:id", medicalRecordController_1.getMedicalRecordById);
// Update medical record status
router.patch("/:id/status", medicalRecordController_1.updateMedicalRecordStatus);
// Delete medical record
router.delete("/:id", medicalRecordController_1.deleteMedicalRecord);
exports.default = router;
