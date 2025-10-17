import mongoose, { Schema, Document } from "mongoose";
import { PaymentStatus } from "../types/appointment";

export interface IPayment extends Document {
  // Required references
  patientId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  prescriptionId?: mongoose.Types.ObjectId;

  // Payment details
  amount: number;
  status: PaymentStatus;
  paymentMethod: "banking" | "wallet" | "payos";
  description: string;

  // Transaction tracking
  transactionId?: string; // Timestamps
  dueDate?: Date;
  authorizedAt?: Date;
  capturedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;

  // Refund information
  refundAmount?: number;
  refundReason?: string;

  // Payment provider specific fields
  vnpayTxnRef?: string;
  vnpayResponseCode?: string;

  // Bank transfer details
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    transactionRef?: string;
    paymentProof?: string;
  };

  // Timestamps from schema
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    // Required references
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
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
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
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
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster queries
PaymentSchema.index({ appointmentId: 1 });
PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ patientId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ vnpayTxnRef: 1 });

// Add methods to check payment state
PaymentSchema.methods.isPaid = function (): boolean {
  return this.status === PaymentStatus.CAPTURED;
};

PaymentSchema.methods.isRefunded = function (): boolean {
  return this.status === PaymentStatus.REFUNDED;
};

PaymentSchema.methods.isOverdue = function (): boolean {
  return (
    this.status === PaymentStatus.PENDING &&
    this.dueDate &&
    this.dueDate < new Date()
  );
};

const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
