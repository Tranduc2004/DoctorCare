import mongoose, { Schema, Document } from "mongoose";
import { PaymentStatus, PaymentType } from "../types/appointment";

export interface IPayment extends Document {
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  type: PaymentType;
  status: PaymentStatus;
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: Date;
  dueDate?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  insuranceCoverage?: number;
  patientAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    transactionId: String,
    paymentMethod: String,
    paidAt: Date,
    dueDate: Date,
    refundedAt: Date,
    refundAmount: {
      type: Number,
      min: 0,
    },
    insuranceCoverage: {
      type: Number,
      min: 0,
      default: 0,
    },
    patientAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
PaymentSchema.index({ appointmentId: 1 });
PaymentSchema.index({ patientId: 1 });
PaymentSchema.index({ doctorId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: 1 });

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
