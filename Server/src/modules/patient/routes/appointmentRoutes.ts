import { Router } from "express";
import {
  createAppointment,
  getPatientAppointments,
  getAppointmentHistory,
  cancelAppointment,
  updateSymptoms,
} from "../controllers";

const router = Router();

// Patient: Quản lý lịch hẹn của mình
router.post("/", createAppointment);
router.get("/", getPatientAppointments);
router.get("/history", getAppointmentHistory);
router.put("/cancel/:id", cancelAppointment);
router.put("/symptoms/:id", updateSymptoms);

export default router;
