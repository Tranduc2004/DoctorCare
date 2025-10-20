import { Router } from "express";
import {
  registerStaff,
  loginStaff,
  getMyProfile,
} from "../controllers/staffController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Public routes (no authentication required)
router.post("/register", registerStaff);
router.post("/login", loginStaff);

// Protected routes (authentication required)
router.get("/profile", authMiddleware, getMyProfile);

// Note: Admin operations (approve, reject, manage) are handled by Main Server
// This service focuses on staff registration, authentication, and profile management

export default router;
