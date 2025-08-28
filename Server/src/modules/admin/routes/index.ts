// Admin Routes Index
import { Router } from "express";
import appointmentRoutes from "./appointmentRoutes";
import userRoutes from "./userRoutes";
import authRoutes from "./authRoutes";
import scheduleRoutes from "./scheduleRoutes";

const router = Router();

// Admin routes
router.use("/auth", authRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/users", userRoutes);
router.use("/schedules", scheduleRoutes);

export default router;
