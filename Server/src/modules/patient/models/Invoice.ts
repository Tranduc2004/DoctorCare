import mongoose, { Schema, Document } from "mongoose";
import {
  PaymentStatus,
  PaymentType,
  InsuranceCoverage,
} from "../../../shared/types/appointment";

export interface PaymentItem {
  type: PaymentType;
  description: string;
  amount: number;
  insuranceCoverage?: InsuranceCoverage;
  insuranceAmount?: number;
  patientAmount: number;
}

export interface IInvoice extends Document {
  appointmentId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  type: "consultation" | "final_settlement";
  items: PaymentItem[];
  subtotal: number;
  insuranceCoverage: number;
  patientAmount: number;
  status: PaymentStatus;
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    insuranceCoverage: {
      type: String,
      enum: Object.values(InsuranceCoverage),
    },
    insuranceAmount: {
      type: Number,
      min: 0,
    },
    patientAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["consultation", "final_settlement"],
      required: true,
    },
    items: [PaymentItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    insuranceCoverage: {
      type: Number,
      required: true,
      min: 0,
    },
    patientAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    dueDate: Date,
    paidAt: Date,
  },
  { timestamps: true }
);

// Generate invoice number before validation so required check passes
InvoiceSchema.pre("validate", async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      const count = await mongoose.model("Invoice").countDocuments();
      this.invoiceNumber = `INV-${Date.now()}-${String(count + 1).padStart(
        4,
        "0"
      )}`;
    } catch (err) {
      return next(err as any);
    }
  }
  next();
});

export default mongoose.model<IInvoice>("Invoice", InvoiceSchema);
