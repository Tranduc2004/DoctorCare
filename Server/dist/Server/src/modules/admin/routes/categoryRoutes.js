"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
// Apply admin authentication to all routes
router.use(adminAuth_1.adminAuth);
// Category management routes
router.get("/", categoryController_1.CategoryController.list);
router.get("/stats", categoryController_1.CategoryController.stats);
router.get("/approved", categoryController_1.CategoryController.listApproved);
router.get("/:id", categoryController_1.CategoryController.getById);
router.post("/", categoryController_1.CategoryController.create);
router.put("/:id", categoryController_1.CategoryController.update);
router.put("/:id/approve", categoryController_1.CategoryController.approve);
router.put("/:id/reject", categoryController_1.CategoryController.reject);
router.delete("/:id", categoryController_1.CategoryController.remove);
exports.default = router;
