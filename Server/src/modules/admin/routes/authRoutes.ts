import { Router } from "express";
import { adminLogin, getAdminProfile } from "../controllers";
import { verifyAdminToken } from "../middlewares";

const router = Router();

// Admin auth routes
router.post("/login", adminLogin);
router.get("/profile", verifyAdminToken, getAdminProfile);

export default router;
