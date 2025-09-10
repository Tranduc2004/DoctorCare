"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
// Bảo vệ tất cả endpoints bằng admin auth
router.use(adminAuth_1.verifyAdminToken);
// Tạo 1 ca làm việc
router.post("/", controllers_1.adminCreateDoctorShift);
// Tạo nhiều ca làm việc
router.post("/bulk", controllers_1.adminBulkCreateDoctorShifts);
// Lấy tất cả ca làm việc (tùy chọn lọc theo from/to)
router.get("/", controllers_1.adminGetAllShifts);
// Lấy các ca cần xử lý (pending, rejected, busy)
router.get("/pending/all", controllers_1.adminGetPendingShifts);
// Thay thế bác sĩ cho ca làm việc (phải đặt trước /:id routes)
router.post("/:id/replace-doctor", controllers_1.adminReplaceDoctor);
// Cập nhật ca làm việc theo id
router.put("/:id", controllers_1.adminUpdateDoctorShift);
// Xóa ca làm việc theo id
router.delete("/:id", controllers_1.adminDeleteDoctorShift);
// Lấy ca làm việc theo bác sĩ và khoảng thời gian (phải đặt cuối cùng)
router.get("/:doctorId", controllers_1.adminGetDoctorShifts);
exports.default = router;
