import { Router } from "express";
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  getAppointmentsByDate,
  getAppointmentStats,
} from "../controllers";

const router = Router();

// Doctor: Quản lý lịch hẹn của mình
router.get("/", getDoctorAppointments);
router.get("/by-date", getAppointmentsByDate);
router.get("/stats", getAppointmentStats);
router.put("/:id/status", updateAppointmentStatus);

export default router;
