"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../middlewares");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Tất cả routes đều yêu cầu xác thực admin
router.use(middlewares_1.adminAuth);
// Lấy tất cả chuyên khoa
router.get("/", controllers_1.getAllSpecialties);
// Tìm kiếm chuyên khoa - đặt TRƯỚC /:id để tránh conflict
router.get("/search", controllers_1.searchSpecialties);
// Lấy chuyên khoa đang hoạt động - đặt TRƯỚC /:id để tránh conflict
router.get("/active/list", controllers_1.getActiveSpecialties);
// Lấy chuyên khoa theo ID
router.get("/:id", controllers_1.getSpecialtyById);
// Tạo chuyên khoa mới
router.post("/", middlewares_1.uploadSingle, controllers_1.createSpecialty);
// Cập nhật chuyên khoa
router.put("/:id", middlewares_1.uploadSingle, controllers_1.updateSpecialty);
// Xóa chuyên khoa (soft delete)
router.delete("/:id", controllers_1.deleteSpecialty);
// Xóa hoàn toàn chuyên khoa
router.delete("/:id/hard", controllers_1.hardDeleteSpecialty);
exports.default = router;
