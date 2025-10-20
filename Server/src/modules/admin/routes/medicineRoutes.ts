import { Router } from "express";
import {
  getPendingMedicines,
  approveMedicine,
  rejectMedicine,
  getAllMedicines,
  createMedicine,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getMedicineStatistics,
} from "../controllers/medicineController";
import { adminAuth } from "../middlewares/adminAuth";

const router = Router();

// All routes require admin auth
router.use(adminAuth);

// Specific routes must come before parameterized routes
router.get("/pending", getPendingMedicines); // Thuốc chờ duyệt
router.get("/statistics", getMedicineStatistics); // Thống kê thuốc

// Medicine management routes
router.get("/", getAllMedicines); // Lấy tất cả thuốc
router.post("/", createMedicine); // Tạo thuốc mới
router.get("/:id", getMedicineById); // Lấy chi tiết thuốc
router.put("/:id", updateMedicine); // Cập nhật thuốc
router.delete("/:id", deleteMedicine); // Xóa thuốc

// Approval routes
router.put("/:id/approve", approveMedicine); // Duyệt thuốc
router.put("/:id/reject", rejectMedicine); // Từ chối thuốc

export default router;
