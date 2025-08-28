"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Doctor: Quản lý lịch làm việc
router.post("/", controllers_1.createSchedule);
router.get("/available", controllers_1.getDoctorSchedules);
router.get("/my", controllers_1.getMySchedules);
router.get("/stats", controllers_1.getScheduleStats);
router.put("/:id", controllers_1.updateSchedule);
router.delete("/:id", controllers_1.deleteSchedule);
exports.default = router;
