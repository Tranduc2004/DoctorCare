import { Router } from "express";
import { CategoryController } from "../../admin/controllers/categoryController";
import { adminAuth } from "../../admin/middlewares/adminAuth"; // Sử dụng cùng middleware

const router = Router();

// Apply staff authentication to all routes
router.use(adminAuth);

// Pharmacy category routes - chỉ lấy approved categories
router.get("/approved", CategoryController.listApproved);
router.get("/active", CategoryController.listApproved); // Alias for approved categories

export default router;
