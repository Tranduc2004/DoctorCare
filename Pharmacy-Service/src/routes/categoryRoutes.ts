import { Router } from "express";
import {
  createCategory,
  getMyCategorycontroller,
  getApprovedCategories,
  getCategoryById,
  getAllCategories,
  getCategoryStats,
  updateCategory,
  deleteCategory,
  getMedicinesByCategory,
  getCategoryWithMedicineCount,
} from "../controllers/categoryController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/approved", getApprovedCategories);

// Protected routes (staff authentication required)
router.use(authMiddleware);

router.get("/stats", getCategoryStats);
router.get("/", getAllCategories);
router.post("/", createCategory);
router.get("/my", getMyCategorycontroller);

// Specific routes MUST come before generic :id routes
router.get("/:id/details", getCategoryWithMedicineCount);
router.get("/:categoryId/medicines", getMedicinesByCategory);

// Generic routes come last
router.get("/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
