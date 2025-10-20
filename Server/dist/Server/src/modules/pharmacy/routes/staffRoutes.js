"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StaffController_1 = require("../controllers/StaffController");
const router = (0, express_1.Router)();
// All routes are prefixed with /api/admin/pharmacy
// So these become /api/admin/pharmacy/staff/*
// Get all staff with pagination and filtering
router.get("/staff", StaffController_1.StaffController.getAllStaff);
// Get staff statistics
router.get("/staff/stats", StaffController_1.StaffController.getStaffStats);
// Get staff by ID
router.get("/staff/:id", StaffController_1.StaffController.getStaffById);
// Approve staff
router.put("/staff/:id/approve", StaffController_1.StaffController.approveStaff);
// Reject staff
router.put("/staff/:id/reject", StaffController_1.StaffController.rejectStaff);
// Update staff status (active/inactive)
router.put("/staff/:id/status", StaffController_1.StaffController.updateStaffStatus);
// Update staff role
router.put("/staff/:id/role", StaffController_1.StaffController.updateStaffRole);
// Delete staff
router.delete("/staff/:id", StaffController_1.StaffController.deleteStaff);
exports.default = router;
