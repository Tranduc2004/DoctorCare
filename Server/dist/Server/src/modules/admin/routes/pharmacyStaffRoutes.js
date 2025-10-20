"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pharmacyStaffController_1 = require("../controllers/pharmacyStaffController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = express_1.default.Router();
// Tất cả routes yêu cầu admin authentication
router.use(adminAuth_1.adminAuth);
// GET /api/admin/pharmacy-staff - Lấy danh sách pharmacy staff
router.get("/", pharmacyStaffController_1.getAllPharmacyStaff);
// GET /api/admin/pharmacy-staff/stats - Lấy thống kê
router.get("/stats", pharmacyStaffController_1.getPharmacyStaffStats);
// GET /api/admin/pharmacy-staff/:id - Lấy thông tin chi tiết
router.get("/:id", pharmacyStaffController_1.getPharmacyStaffById);
// POST /api/admin/pharmacy-staff - Tạo pharmacy staff mới
router.post("/", pharmacyStaffController_1.createPharmacyStaff);
// PUT /api/admin/pharmacy-staff/:id/approve - Duyệt pharmacy staff
router.put("/:id/approve", pharmacyStaffController_1.approvePharmacyStaff);
// PUT /api/admin/pharmacy-staff/:id/reject - Từ chối pharmacy staff
router.put("/:id/reject", pharmacyStaffController_1.rejectPharmacyStaff);
// PUT /api/admin/pharmacy-staff/:id/permissions - Cập nhật quyền hạn
router.put("/:id/permissions", pharmacyStaffController_1.updatePharmacyStaffPermissions);
// PUT /api/admin/pharmacy-staff/:id/toggle-status - Tạm ngưng/Kích hoạt
router.put("/:id/toggle-status", pharmacyStaffController_1.togglePharmacyStaffStatus);
// DELETE /api/admin/pharmacy-staff/:id - Xóa pharmacy staff
router.delete("/:id", pharmacyStaffController_1.deletePharmacyStaff);
exports.default = router;
