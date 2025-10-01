import express from "express";
import {
  createConsultationInvoice,
  processPayment,
  createFinalInvoice,
  getPaymentStatus,
  getPaymentHistory,
  refundPayment,
} from "../controllers/paymentController";
import { verifyPatientToken } from "../middlewares/patientAuth";

const router = express.Router();

// All routes require patient authentication
router.use(verifyPatientToken);

// Get payment history
router.get("/", getPaymentHistory);

// Create consultation invoice (when doctor approves)
router.post("/consultation-invoice/:appointmentId", createConsultationInvoice);

// Process payment
router.post("/process", processPayment);

// Create final settlement invoice (after consultation)
router.post("/final-invoice/:appointmentId", createFinalInvoice);

// Get payment status
router.get("/status/:appointmentId", getPaymentStatus);

// Refund payment
router.post("/refund", refundPayment);

export default router;
