"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../../admin/controllers");
const router = (0, express_1.Router)();
// Route công khai - không cần xác thực
// Lấy danh sách chuyên khoa đang hoạt động
// Đặt route này TRƯỚC route /:id để tránh conflict
router.get('/active', controllers_1.getActiveSpecialties);
// Lấy chuyên khoa theo ID (công khai)
// Đặt route này SAU route /active
router.get('/:id', controllers_1.getSpecialtyById);
exports.default = router;
