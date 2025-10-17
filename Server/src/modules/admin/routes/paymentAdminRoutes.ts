import { Router } from "express";
import { verifyAdminToken } from "../middlewares/adminAuth";
import {
  getAllPayments,
  getPaymentById,
  refundPayment,
  updatePaymentStatus,
  getPaymentStatistics,
  exportPayments,
  createPayosOrderForInvoice,
} from "../controllers/paymentAdminController";

const router = Router();

// Apply auth middleware to all routes
router.use(verifyAdminToken);

// Payment list and details
router.get("/", getAllPayments);
router.get("/:id", getPaymentById);

// Payment actions
router.post("/:id/refund", refundPayment);
router.put("/:id/status", updatePaymentStatus);

// Statistics and reports
router.get("/statistics/overview", getPaymentStatistics);
router.get("/export", exportPayments);

// PayOS integration
router.post("/:invoiceId/create-payos-order", createPayosOrderForInvoice);

export default router;
