import { Router } from "express";
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  getAppointmentsByDate,
  getAppointmentStats,
  // reschedule handlers
  requestReschedule,
  acceptReschedule,
} from "../controllers";

const router = Router();

// Doctor: Quản lý lịch hẹn của mình
router.get("/", getDoctorAppointments);
router.get("/by-date", getAppointmentsByDate);
router.get("/stats", getAppointmentStats);
router.put("/:appointmentId/status", updateAppointmentStatus);
// Doctor requests a reschedule (provide newScheduleId)
router.post("/:appointmentId/request-reschedule", requestReschedule);
// Doctor accepts patient's reschedule selection (or confirms)
router.post("/:appointmentId/accept-reschedule", acceptReschedule);

export default router;
