"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medicineController_1 = require("../controllers/medicineController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
// All routes require admin auth
router.use(adminAuth_1.adminAuth);
// Specific routes must come before parameterized routes
router.get("/pending", medicineController_1.getPendingMedicines); // Thuốc chờ duyệt
router.get("/statistics", medicineController_1.getMedicineStatistics); // Thống kê thuốc
// Medicine management routes
router.get("/", medicineController_1.getAllMedicines); // Lấy tất cả thuốc
router.post("/", medicineController_1.createMedicine); // Tạo thuốc mới
router.get("/:id", medicineController_1.getMedicineById); // Lấy chi tiết thuốc
router.put("/:id", medicineController_1.updateMedicine); // Cập nhật thuốc
router.delete("/:id", medicineController_1.deleteMedicine); // Xóa thuốc
// Approval routes
router.put("/:id/approve", medicineController_1.approveMedicine); // Duyệt thuốc
router.put("/:id/reject", medicineController_1.rejectMedicine); // Từ chối thuốc
exports.default = router;
