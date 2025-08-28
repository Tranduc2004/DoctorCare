import { Router } from "express";
import { patientRegister, patientLogin, getPatientProfile } from "../controllers";
import { verifyPatientToken } from "../middlewares";

const router = Router();

// Patient auth routes
router.post("/register", patientRegister);
router.post("/login", patientLogin);
router.get("/profile", verifyPatientToken, getPatientProfile);

export default router;
