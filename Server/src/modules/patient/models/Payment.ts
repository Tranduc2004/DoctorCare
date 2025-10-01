import mongoose, { Schema, Document } from "mongoose";
import {
  PaymentStatus,
  PaymentType,
  InsuranceCoverage,
} from "../../../shared/types/appointment";

export interface IPayment extends Document {
  appointmentId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  authorizedAt?: Date;
  capturedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
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
      required: true,
    },
    transactionId: String,
    authorizedAt: Date,
    capturedAt: Date,
    refundedAt: Date,
    refundAmount: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>("Payment", PaymentSchema);
