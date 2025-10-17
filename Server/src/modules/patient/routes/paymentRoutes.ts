import express from "express";
import {
  createConsultationInvoice,
  processPayment,
  createFinalInvoice,
  getPaymentStatus,
  // new helper: get status by invoice id
  getPaymentStatusByInvoice,
  getPaymentHistory,
  refundPayment,
  createVNPayPayment,
  handleVNPayReturn,
  getVNPayPaymentStatus,
  confirmVNPayFromClient,
  // new export will be implemented in controller file
  generateBankTransferQr,
  createPayosLink,
  debugCreatePayosLink,
  handlePayosWebhook,
} from "../controllers/paymentController";
import { computeVnPayHash } from "../controllers/paymentDebugController";
import { verifyPatientToken } from "../middlewares/patientAuth";

const router = express.Router();

// Important: Place public endpoints BEFORE any middleware
// PayOS webhook endpoint must be WITHOUT any middleware
router.post(
  "/payos/webhook",
  express.raw({ type: "application/json" }),
  handlePayosWebhook
);

// VNPay return endpoint (no auth required - called by VNPay)
router.get("/vnpay/return", handleVNPayReturn);

// Public debug endpoint to test PayOS SDK from browser/terminal without auth
router.post("/payos/debug/create", debugCreatePayosLink);

// Dev helper: compute HMAC candidates for supplied body (raw or JSON) to aid debugging
router.post("/payos/debug/hmac", (req, res) => {
  try {
    const raw = (req as any).rawBody || req.body;
    const payload = typeof req.body === "object" ? req.body : {};
    const dataForSign =
      payload.data && typeof payload.data === "object" ? payload.data : payload;
    const bodyStr = typeof raw === "string" ? raw : JSON.stringify(raw);
    const crypto = require("crypto");
    const key = process.env.PAYOS_CHECKSUM_KEY || "";
    const candidates: Record<string, string> = {};
    // raw
    try {
      const re = /"data"\s*:\s*/i;
      const idx = bodyStr.search(re);
      if (idx >= 0) {
        // naive extraction
        const sub = bodyStr.slice(idx);
        const firstBrace = sub.indexOf("{");
        if (firstBrace >= 0) {
          // take until end
          const snippet = sub.slice(firstBrace);
          candidates.raw = crypto
            .createHmac("sha256", key)
            .update(snippet)
            .digest("hex");
        }
      }
    } catch (e) {}
    // minified
    try {
      const min = JSON.stringify(dataForSign).replace(/\s+/g, "");
      candidates.minified = crypto
        .createHmac("sha256", key)
        .update(min)
        .digest("hex");
    } catch (e) {}
    // stringify
    try {
      const s = JSON.stringify(dataForSign);
      candidates.stringify = crypto
        .createHmac("sha256", key)
        .update(s)
        .digest("hex");
    } catch (e) {}
    // sorted
    try {
      const stable = (function stableStringify(v: any): string {
        if (v === null || v === undefined) return JSON.stringify(v);
        if (typeof v !== "object") return JSON.stringify(v);
        if (Array.isArray(v))
          return `[${v.map((i) => stableStringify(i)).join(",")}]`;
        const ks = Object.keys(v).sort();
        return `{${ks
          .map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`)
          .join(",")}}`;
      })(dataForSign);
      candidates.sorted = crypto
        .createHmac("sha256", key)
        .update(stable)
        .digest("hex");
    } catch (e) {}

    res.json({ candidates });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Debug: compute sign/hash from supplied params (no auth)
router.post("/vnpay/debug/compute", computeVnPayHash);

// Client forwards VNPay return params (POST) to confirm payment
router.post("/vnpay/confirm", confirmVNPayFromClient);

// Get VNPay payment status (no auth required for status check)
router.get("/vnpay/status/:txnRef", getVNPayPaymentStatus);

// All other routes require patient authentication
router.use(verifyPatientToken);

// Bank transfer QR generation (patient authenticated)

// Get payment history
router.get("/", getPaymentHistory);

// Create consultation invoice (when doctor approves)
router.post("/consultation-invoice/:appointmentId", createConsultationInvoice);

// Process payment
router.post("/process", processPayment);

// VNPay payment creation
router.post("/vnpay/create", createVNPayPayment);

// Create PayOS payment link (patient)
router.post("/payos/create", createPayosLink);

// Debug: create PayOS payment link (returns raw SDK response or error)
router.post("/payos/debug/create", debugCreatePayosLink);

// Generate bank transfer QR (patient) - returns dataURL and payment payload
router.post("/bank-transfer/qr", generateBankTransferQr);

// Create final settlement invoice (after consultation)
router.post("/final-invoice/:appointmentId", createFinalInvoice);

// Get payment status
router.get("/status/:appointmentId", getPaymentStatus);

// Get payment status by invoice id (patient authenticated)
router.get("/status/invoice/:invoiceId", getPaymentStatusByInvoice);

// Refund payment
router.post("/refund", refundPayment);

export default router;
