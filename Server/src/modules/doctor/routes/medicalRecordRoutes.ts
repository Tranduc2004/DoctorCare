import { Router } from "express";
import {
  createMedicalRecord,
  getPatientMedicalRecords,
  updateMedicalRecord,
  getDoctorMedicalRecords,
  getMedicalRecordDetail,
} from "../controllers";

const router = Router();

// Doctor: Quản lý hồ sơ bệnh án
router.post("/", createMedicalRecord);
router.get("/my", getDoctorMedicalRecords);
router.get("/patient/:patientId", getPatientMedicalRecords);
router.get("/:id", getMedicalRecordDetail);
router.put("/:id", updateMedicalRecord);

export default router;
