"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/approved", categoryController_1.getApprovedCategories);
router.use(auth_1.authMiddleware);
router.get("/stats", categoryController_1.getCategoryStats);
router.get("/", categoryController_1.getAllCategories);
router.post("/", categoryController_1.createCategory);
router.get("/my", categoryController_1.getMyCategorycontroller);
router.get("/:id/details", categoryController_1.getCategoryWithMedicineCount);
router.get("/:categoryId/medicines", categoryController_1.getMedicinesByCategory);
router.get("/:id", categoryController_1.getCategoryById);
router.put("/:id", categoryController_1.updateCategory);
router.delete("/:id", categoryController_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map