import { Router } from "express";
import {
  createSchedule,
  getDoctorSchedules,
  getDoctorSchedulesById,
  getMySchedules,
  acceptSchedule,
  rejectSchedule,
  reportBusy,
  updateSchedule,
  deleteSchedule,
  getScheduleStats,
} from "../controllers";

const router = Router();

// Doctor: Quản lý lịch làm việc
router.post("/", createSchedule);
router.get("/available", getDoctorSchedules); // Lấy lịch của bác sĩ cụ thể (cho bệnh nhân)
router.get("/my", getMySchedules); // Lấy lịch của bác sĩ đang đăng nhập
router.get("/stats", getScheduleStats);
router.get("/:doctorId/schedules", getDoctorSchedulesById); // Lấy lịch của bác sĩ cụ thể (alternative)
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

// Doctor: Xác nhận/từ chối/báo bận lịch làm việc
router.post("/:id/accept", acceptSchedule);
router.post("/:id/reject", rejectSchedule);
router.post("/:id/busy", reportBusy);

export default router;
