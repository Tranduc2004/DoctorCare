import { Router } from "express";
import {
  createAppointment,
  getPatientAppointments,
  getAppointmentHistory,
  cancelAppointment,
  updateSymptoms,
  extendAppointment,
  extensionConsent,
  checkinAppointment,
  // new handlers
  reschedulePropose,
  rescheduleAccept,
} from "../controllers";

const router = Router();

// Patient: Quản lý lịch hẹn của mình
router.post("/", createAppointment);
router.get("/", getPatientAppointments);
router.get("/history", getAppointmentHistory);
router.put("/cancel/:id", cancelAppointment);
router.put("/symptoms/:id", updateSymptoms);
// Doctor requests extension for an appointment
router.post("/:id/extend", extendAppointment);
// Patient responds to extension consent request
router.post("/:nextId/extension-consent", extensionConsent);
// Check-in by patient or doctor
router.post("/:id/checkin", checkinAppointment);
// Patient proposes reschedule (send 1-5 alternative slots)
router.post("/:id/reschedule-propose", reschedulePropose);
// Patient accepts a reschedule proposed by doctor (or confirms a new slot)
router.post("/:id/reschedule-accept", rescheduleAccept);

export default router;
