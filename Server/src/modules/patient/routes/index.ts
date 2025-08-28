// Patient Routes Index
import { Router } from "express";
import appointmentRoutes from "./appointmentRoutes";
import medicalRecordRoutes from "./medicalRecordRoutes";
import authRoutes from "./authRoutes";

const router = Router();

// Patient routes
router.use("/auth", authRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/medical-records", medicalRecordRoutes);

export default router;
