"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../middlewares/adminAuth");
const paymentAdminController_1 = require("../controllers/paymentAdminController");
const router = (0, express_1.Router)();
// Apply auth middleware to all routes
router.use(adminAuth_1.verifyAdminToken);
// Payment list and details
router.get("/", paymentAdminController_1.getAllPayments);
router.get("/:id", paymentAdminController_1.getPaymentById);
// Payment actions
router.post("/:id/refund", paymentAdminController_1.refundPayment);
router.put("/:id/status", paymentAdminController_1.updatePaymentStatus);
// Statistics and reports
router.get("/statistics/overview", paymentAdminController_1.getPaymentStatistics);
router.get("/export", paymentAdminController_1.exportPayments);
// PayOS integration
router.post("/:invoiceId/create-payos-order", paymentAdminController_1.createPayosOrderForInvoice);
exports.default = router;
