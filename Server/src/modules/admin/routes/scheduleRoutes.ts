import { Router } from "express";
import {
  adminCreateDoctorShift,
  adminBulkCreateDoctorShifts,
  adminGetDoctorShifts,
  adminGetAllShifts,
  adminGetPendingShifts,
  adminUpdateDoctorShift,
  adminDeleteDoctorShift,
  adminReplaceDoctor,
} from "../controllers";
import { verifyAdminToken } from "../middlewares/adminAuth";

const router = Router();

// Bảo vệ tất cả endpoints bằng admin auth
router.use(verifyAdminToken);

// Tạo 1 ca làm việc
router.post("/", adminCreateDoctorShift);

// Tạo nhiều ca làm việc
router.post("/bulk", adminBulkCreateDoctorShifts);

// Lấy tất cả ca làm việc (tùy chọn lọc theo from/to)
router.get("/", adminGetAllShifts);

// Lấy các ca cần xử lý (pending, rejected, busy)
router.get("/pending/all", adminGetPendingShifts);

// Thay thế bác sĩ cho ca làm việc (phải đặt trước /:id routes)
router.post("/:id/replace-doctor", adminReplaceDoctor);

// Cập nhật ca làm việc theo id
router.put("/:id", adminUpdateDoctorShift);

// Xóa ca làm việc theo id
router.delete("/:id", adminDeleteDoctorShift);

// Lấy ca làm việc theo bác sĩ và khoảng thời gian (phải đặt cuối cùng)
router.get("/:doctorId", adminGetDoctorShifts);

export default router;
