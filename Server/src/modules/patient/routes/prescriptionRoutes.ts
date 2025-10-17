import { Router } from "express";
import {
  getPatientPrescriptions,
  getPrescriptionDetail,
  searchPrescriptions,
  getPrescriptionsByDateRange,
  getPrescriptionsByStatus,
} from "../controllers/prescriptionController";

const router = Router();

// Patient: Xem đơn thuốc của mình
router.get("/", getPatientPrescriptions);
router.get("/search", searchPrescriptions);
router.get("/date-range", getPrescriptionsByDateRange);
router.get("/status", getPrescriptionsByStatus);
router.get("/:prescriptionId", getPrescriptionDetail);

export default router;
