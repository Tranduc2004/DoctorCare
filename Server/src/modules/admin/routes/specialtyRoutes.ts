import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth";
import {
  getAllSpecialties,
  searchSpecialties,
  getActiveSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  hardDeleteSpecialty,
} from "../controllers";

const router = Router();

// Tất cả routes đều yêu cầu xác thực admin
router.use(adminAuth);

// Lấy tất cả chuyên khoa
router.get("/", getAllSpecialties);

// Tìm kiếm chuyên khoa - đặt TRƯỚC /:id để tránh conflict
router.get("/search", searchSpecialties);

// Lấy chuyên khoa đang hoạt động - đặt TRƯỚC /:id để tránh conflict
router.get("/active/list", getActiveSpecialties);

// Lấy chuyên khoa theo ID
router.get("/:id", getSpecialtyById);

// Tạo chuyên khoa mới
router.post("/", createSpecialty);

// Cập nhật chuyên khoa
router.put("/:id", updateSpecialty);

// Xóa chuyên khoa (soft delete)
router.delete("/:id", deleteSpecialty);

// Xóa hoàn toàn chuyên khoa
router.delete("/:id/hard", hardDeleteSpecialty);

export default router;
