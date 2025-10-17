import { Router } from "express";
import {
  getAllMedicalRecords,
  getMedicalRecordById,
  getMedicalRecordsStats,
  deleteMedicalRecord,
  updateMedicalRecordStatus,
  getMedicalRecordsByPatient,
  getMedicalRecordsByDoctor,
} from "../controllers/medicalRecordController";
import { adminAuth } from "../middlewares/adminAuth";

const router = Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// Get all medical records with filters and pagination
router.get("/", getAllMedicalRecords);

// Get medical records statistics
router.get("/stats", getMedicalRecordsStats);

// Get medical records by patient
router.get("/patient/:patientId", getMedicalRecordsByPatient);

// Get medical records by doctor
router.get("/doctor/:doctorId", getMedicalRecordsByDoctor);

// Get specific medical record by ID
router.get("/:id", getMedicalRecordById);

// Update medical record status
router.patch("/:id/status", updateMedicalRecordStatus);

// Delete medical record
router.delete("/:id", deleteMedicalRecord);

export default router;
