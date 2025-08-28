import { Router } from "express";
import {
  createAppointment,
  getPatientAppointments,
  cancelAppointment,
  updateSymptoms,
} from "../controllers";

const router = Router();

// Patient: Quản lý lịch hẹn của mình
router.post("/", createAppointment);
router.get("/", getPatientAppointments);
router.put("/cancel/:id", cancelAppointment);
router.put("/symptoms/:id", updateSymptoms);

export default router;
