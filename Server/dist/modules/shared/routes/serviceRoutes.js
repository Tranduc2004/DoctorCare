"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../../admin/controllers");
const router = (0, express_1.Router)();
// Public routes for services
// Lấy danh sách dịch vụ đang hoạt động
// Đặt route này TRƯỚC route /:id để tránh conflict
router.get("/active", controllers_1.getActiveServices);
// Lấy dịch vụ theo ID (công khai)
// Đặt route này SAU route /active
router.get("/:id", controllers_1.getServiceById);
exports.default = router;
