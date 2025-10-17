import express from "express";
import {
  register,
  login,
  getCurrentUser,
  verifyToken,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authMiddleware, getCurrentUser);
router.get("/verify", authMiddleware, verifyToken);

export default router;
