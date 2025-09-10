"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Doctor: Quản lý lịch làm việc
router.post("/", controllers_1.createSchedule);
router.get("/available", controllers_1.getDoctorSchedules); // Lấy lịch của bác sĩ cụ thể (cho bệnh nhân)
router.get("/my", controllers_1.getMySchedules); // Lấy lịch của bác sĩ đang đăng nhập
router.get("/stats", controllers_1.getScheduleStats);
router.get("/:doctorId/schedules", controllers_1.getDoctorSchedulesById); // Lấy lịch của bác sĩ cụ thể (alternative)
router.put("/:id", controllers_1.updateSchedule);
router.delete("/:id", controllers_1.deleteSchedule);
// Doctor: Xác nhận/từ chối/báo bận lịch làm việc
router.post("/:id/accept", controllers_1.acceptSchedule);
router.post("/:id/reject", controllers_1.rejectSchedule);
router.post("/:id/busy", controllers_1.reportBusy);
exports.default = router;
