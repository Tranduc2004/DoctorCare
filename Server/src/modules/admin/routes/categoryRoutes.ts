import { Router } from "express";
import { CategoryController } from "../controllers/categoryController";
import { adminAuth } from "../middlewares/adminAuth";

const router = Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Category management routes
router.get("/", CategoryController.list);
router.get("/stats", CategoryController.stats);
router.get("/approved", CategoryController.listApproved);
router.get("/active", CategoryController.listApproved); // Alias for approved categories
router.get("/mine", CategoryController.listMine);
router.get("/:id", CategoryController.getById);
router.post("/", CategoryController.create);
router.put("/:id", CategoryController.update);
router.put("/:id/approve", CategoryController.approve);
router.put("/:id/reject", CategoryController.reject);
router.delete("/:id", CategoryController.remove);

export default router;
