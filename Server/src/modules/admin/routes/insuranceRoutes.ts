import express from "express";
import {
  getInsuranceVerifications,
  verifyInsurance,
  getVerificationHistory,
  updateInsuranceExpiry,
} from "../controllers/insuranceController";
import { verifyAdminToken, adminAuth } from "../middlewares/adminAuth";

const router = express.Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// Get paginated list of insurance verifications
router.get("/", getInsuranceVerifications);

// Verify or reject an insurance submission
router.put("/:insuranceId/verify", verifyInsurance);

// Get verification history for an insurance record
router.get("/:insuranceId/history", getVerificationHistory);

// Update insurance expiry date
router.put("/:insuranceId/expiry", updateInsuranceExpiry);

export default router;
