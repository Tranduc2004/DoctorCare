import { Router } from "express";
import {
  forgotPassword,
  resetPassword,
} from "../../../shared/controllers/authController";

const router = Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
