import { Router } from "express";
import {
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentStats,
} from "../controllers";

const router = Router();

// Admin: Quản lý tất cả lịch hẹn
router.get("/", getAllAppointments);
router.get("/stats", getAppointmentStats);
router.put("/status/:id", updateAppointmentStatus);
router.delete("/:id", deleteAppointment);

export default router;
