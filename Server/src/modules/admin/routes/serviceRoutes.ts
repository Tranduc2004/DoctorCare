import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth";
import {
  getAllServices,
  searchServices,
  getActiveServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  hardDeleteService,
} from "../controllers";

const router = Router();

// Tất cả routes đều yêu cầu xác thực admin
router.use(adminAuth);

// Lấy tất cả dịch vụ
router.get("/", getAllServices);

// Tìm kiếm dịch vụ - đặt TRƯỚC /:id để tránh conflict
router.get("/search", searchServices);

// Lấy dịch vụ đang hoạt động - đặt TRƯỚC /:id để tránh conflict
router.get("/active/list", getActiveServices);

// Lấy dịch vụ theo ID
router.get("/:id", getServiceById);

// Tạo dịch vụ mới
router.post("/", createService);

// Cập nhật dịch vụ
router.put("/:id", updateService);

// Xóa dịch vụ (soft delete)
router.delete("/:id", deleteService);

// Xóa hoàn toàn dịch vụ
router.delete("/:id/hard", hardDeleteService);

export default router;
