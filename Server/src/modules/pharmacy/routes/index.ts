import { Router } from "express";
import staffRoutes from "./staffRoutes";
import categoryRoutes from "./categoryRoutes";

const router = Router();

// All routes are prefixed with /api/pharmacy
// So these become /api/pharmacy/*

// Staff management routes
router.use("/", staffRoutes);

// Category routes for pharmacy
router.use("/", categoryRoutes);

export default router;
