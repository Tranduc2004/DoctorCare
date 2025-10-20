"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const insuranceController_1 = require("../controllers/insuranceController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = express_1.default.Router();
// Apply admin auth middleware to all routes
router.use(adminAuth_1.adminAuth);
// Get paginated list of insurance verifications
router.get("/", insuranceController_1.getInsuranceVerifications);
// Verify or reject an insurance submission
router.put("/:insuranceId/verify", insuranceController_1.verifyInsurance);
// Get verification history for an insurance record
router.get("/:insuranceId/history", insuranceController_1.getVerificationHistory);
// Update insurance expiry date
router.put("/:insuranceId/expiry", insuranceController_1.updateInsuranceExpiry);
exports.default = router;
