"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const appointment_1 = require("../types/appointment");
const PaymentSchema = new mongoose_1.Schema({
    // Required references
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    appointmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
    },
    invoiceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Invoice",
    },
    prescriptionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Prescription",
    },
    // Payment details
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: Object.values(appointment_1.PaymentStatus),
        default: appointment_1.PaymentStatus.PENDING,
    },
    paymentMethod: {
        type: String,
        enum: ["banking", "wallet", "payos", "vnpay"],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    transactionId: String,
    // Timestamps and tracking
    authorizedAt: Date,
    capturedAt: Date,
    failedAt: Date,
    refundedAt: Date,
    refundAmount: {
        type: Number,
        min: 0,
    },
    // VNPay fields
    vnpayTxnRef: {
        type: String,
        index: true,
    },
    vnpayResponseCode: String,
}, {
    timestamps: true,
});
// Add indexes for faster queries
PaymentSchema.index({ appointmentId: 1 });
PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ patientId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ vnpayTxnRef: 1 });
// Add methods to check payment state
PaymentSchema.methods.isPaid = function () {
    return this.status === appointment_1.PaymentStatus.CAPTURED;
};
PaymentSchema.methods.isRefunded = function () {
    return this.status === appointment_1.PaymentStatus.REFUNDED;
};
PaymentSchema.methods.isOverdue = function () {
    return (this.status === appointment_1.PaymentStatus.PENDING &&
        this.dueDate &&
        this.dueDate < new Date());
};
const Payment = mongoose_1.default.model("Payment", PaymentSchema);
exports.default = Payment;
