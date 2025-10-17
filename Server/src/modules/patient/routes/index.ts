// Patient Routes Index
import { Router } from "express";
import appointmentRoutes from "./appointmentRoutes";
import medicalRecordRoutes from "./medicalRecordRoutes";
import prescriptionRoutes from "./prescriptionRoutes";
import authRoutes from "./authRoutes";
import profileRoutes from "./profileRoutes";
import uploadRoutes from "./uploadRoutes";
import paymentRoutes from "./paymentRoutes";

const router = Router();

// Patient routes
router.use("/auth", authRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/profile", profileRoutes);
router.use("/upload", uploadRoutes);
router.use("/payments", paymentRoutes);

export default router;
