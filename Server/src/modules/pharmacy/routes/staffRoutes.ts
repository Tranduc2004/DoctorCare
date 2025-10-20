import { Router } from "express";
import { StaffController } from "../controllers/StaffController";

const router = Router();

// All routes are prefixed with /api/admin/pharmacy
// So these become /api/admin/pharmacy/staff/*

// Get all staff with pagination and filtering
router.get("/staff", StaffController.getAllStaff);

// Get staff statistics
router.get("/staff/stats", StaffController.getStaffStats);

// Get staff by ID
router.get("/staff/:id", StaffController.getStaffById);

// Approve staff
router.put("/staff/:id/approve", StaffController.approveStaff);

// Reject staff
router.put("/staff/:id/reject", StaffController.rejectStaff);

// Update staff status (active/inactive)
router.put("/staff/:id/status", StaffController.updateStaffStatus);

// Update staff role
router.put("/staff/:id/role", StaffController.updateStaffRole);

// Delete staff
router.delete("/staff/:id", StaffController.deleteStaff);

export default router;
