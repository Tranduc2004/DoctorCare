import express from "express";
import {
  getAllPharmacyStaff,
  getPharmacyStaffById,
  createPharmacyStaff,
  approvePharmacyStaff,
  rejectPharmacyStaff,
  updatePharmacyStaffPermissions,
  togglePharmacyStaffStatus,
  deletePharmacyStaff,
  getPharmacyStaffStats,
} from "../controllers/pharmacyStaffController";
import { adminAuth } from "../middlewares/adminAuth";

const router = express.Router();

// Tất cả routes yêu cầu admin authentication
router.use(adminAuth);

// GET /api/admin/pharmacy-staff - Lấy danh sách pharmacy staff
router.get("/", getAllPharmacyStaff);

// GET /api/admin/pharmacy-staff/stats - Lấy thống kê
router.get("/stats", getPharmacyStaffStats);

// GET /api/admin/pharmacy-staff/:id - Lấy thông tin chi tiết
router.get("/:id", getPharmacyStaffById);

// POST /api/admin/pharmacy-staff - Tạo pharmacy staff mới
router.post("/", createPharmacyStaff);

// PUT /api/admin/pharmacy-staff/:id/approve - Duyệt pharmacy staff
router.put("/:id/approve", approvePharmacyStaff);

// PUT /api/admin/pharmacy-staff/:id/reject - Từ chối pharmacy staff
router.put("/:id/reject", rejectPharmacyStaff);

// PUT /api/admin/pharmacy-staff/:id/permissions - Cập nhật quyền hạn
router.put("/:id/permissions", updatePharmacyStaffPermissions);

// PUT /api/admin/pharmacy-staff/:id/toggle-status - Tạm ngưng/Kích hoạt
router.put("/:id/toggle-status", togglePharmacyStaffStatus);

// DELETE /api/admin/pharmacy-staff/:id - Xóa pharmacy staff
router.delete("/:id", deletePharmacyStaff);

export default router;
