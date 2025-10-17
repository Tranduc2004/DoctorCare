"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const controllers_2 = require("../controllers");
const router = (0, express_1.Router)();
// Lấy danh sách bác sĩ theo chuyên khoa
router.get("/", controllers_1.getDoctorsBySpecialty);
// Lấy lịch của bác sĩ
router.get("/schedules/:doctorId", controllers_2.getDoctorSchedulesById);
// Lấy thông tin chi tiết một bác sĩ
router.get("/:id", controllers_1.getDoctorById);
// Lấy tất cả bác sĩ (cho admin)
router.get("/all/list", controllers_1.getAllDoctors);
exports.default = router;
