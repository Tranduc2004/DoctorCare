import { Router } from "express";
import {
  getPatientMedicalRecords,
  getMedicalRecordDetail,
  getPatientHistory,
} from "../controllers";

const router = Router();

// Patient: Xem hồ sơ bệnh án của mình
router.get("/", getPatientMedicalRecords);
router.get("/history", getPatientHistory);
router.get("/:id", getMedicalRecordDetail);

export default router;
