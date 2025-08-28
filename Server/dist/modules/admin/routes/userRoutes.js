"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Admin: Quản lý tất cả người dùng
router.get("/", controllers_1.getAllUsers);
router.get("/role/:role", controllers_1.getUsersByRole);
router.get("/stats", controllers_1.getUserStats);
router.put("/:id", controllers_1.updateUser);
router.delete("/:id", controllers_1.deleteUser);
exports.default = router;
