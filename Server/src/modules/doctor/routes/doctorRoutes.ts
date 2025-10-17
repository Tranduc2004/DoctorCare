import { Router } from "express";
import {
  getDoctorsBySpecialty,
  getDoctorById,
  getAllDoctors,
} from "../controllers";
import { getDoctorSchedulesById } from "../controllers";

const router = Router();

// Lấy danh sách bác sĩ theo chuyên khoa
router.get("/", getDoctorsBySpecialty);

// Lấy lịch của bác sĩ
router.get("/schedules/:doctorId", getDoctorSchedulesById);

// Lấy thông tin chi tiết một bác sĩ
router.get("/:id", getDoctorById);

// Lấy tất cả bác sĩ (cho admin)
router.get("/all/list", getAllDoctors);

export default router;
