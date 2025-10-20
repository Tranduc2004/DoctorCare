"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../middlewares");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Tất cả routes đều yêu cầu xác thực admin
router.use(middlewares_1.adminAuth);
// Lấy tất cả dịch vụ
router.get("/", controllers_1.getAllServices);
// Tìm kiếm dịch vụ - đặt TRƯỚC /:id để tránh conflict
router.get("/search", controllers_1.searchServices);
// Lấy dịch vụ đang hoạt động - đặt TRƯỚC /:id để tránh conflict
router.get("/active/list", controllers_1.getActiveServices);
// Lấy dịch vụ theo ID
router.get("/:id", controllers_1.getServiceById);
// Tạo dịch vụ mới
router.post("/", middlewares_1.uploadSingle, controllers_1.createService);
// Cập nhật dịch vụ
router.put("/:id", middlewares_1.uploadSingle, controllers_1.updateService);
// Xóa dịch vụ (soft delete)
router.delete("/:id", controllers_1.deleteService);
// Xóa hoàn toàn dịch vụ
router.delete("/:id/hard", controllers_1.hardDeleteService);
exports.default = router;
