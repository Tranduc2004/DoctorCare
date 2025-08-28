// Doctor Routes Index
import { Router } from "express";
import scheduleRoutes from "./scheduleRoutes";
import appointmentRoutes from "./appointmentRoutes";
import medicalRecordRoutes from "./medicalRecordRoutes";
import authRoutes from "./authRoutes";
import doctorRoutes from "./doctorRoutes";

const router = Router();

// Doctor routes
router.use("/auth", authRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/doctors", doctorRoutes);

export default router;
