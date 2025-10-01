"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const patientAuth_1 = require("../middlewares/patientAuth");
const router = express_1.default.Router();
// All routes require patient authentication
router.use(patientAuth_1.verifyPatientToken);
// Get payment history
router.get("/", paymentController_1.getPaymentHistory);
// Create consultation invoice (when doctor approves)
router.post("/consultation-invoice/:appointmentId", paymentController_1.createConsultationInvoice);
// Process payment
router.post("/process", paymentController_1.processPayment);
// Create final settlement invoice (after consultation)
router.post("/final-invoice/:appointmentId", paymentController_1.createFinalInvoice);
// Get payment status
router.get("/status/:appointmentId", paymentController_1.getPaymentStatus);
// Refund payment
router.post("/refund", paymentController_1.refundPayment);
exports.default = router;
