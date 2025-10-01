import mongoose, { Document, Schema } from "mongoose";
import {
  AppointmentStatus,
  PaymentStatus,
} from "../../../shared/types/appointment";

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  scheduleId: mongoose.Types.ObjectId;
  status: AppointmentStatus;
  symptoms?: string;
  note?: string;
  appointmentTime: string; // HH:mm format
  appointmentDate: string; // YYYY-MM-DD format

  // Patient contact info from booking form
  patientInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };

  // Payment related fields
  consultationFee?: number;
  depositAmount?: number;
  totalAmount?: number;
  insuranceCoverage?: number;
  patientAmount?: number;
  paymentStatus?: PaymentStatus;

  // Doctor decision
  doctorDecision?: "approved" | "reschedule" | "rejected";
  doctorNotes?: string;
  rescheduleReason?: string;
  rejectionReason?: string;
  newScheduleId?: mongoose.Types.ObjectId;

  // Consultation details
  diagnosis?: string;
  prescription?: string;
  additionalServices?: Array<{
    name: string;
    cost: number;
    description?: string;
  }>;

  // Appointment mode: online or offline (in-person)
  mode?: "online" | "offline";
  // Optional meeting link for online appointments (filled when confirmed)
  meetingLink?: string;

  // Timestamps
  bookedAt: Date;
  confirmedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: "patient" | "doctor" | "system";
  cancellationReason?: string;
  // hold expiry used during AWAIT_PAYMENT
  holdExpiresAt?: Date;
  // created/updated timestamps
  createdAt?: Date;
  updatedAt?: Date;

  // Extension object for extension/consent flow
  extension?: {
    minutes?: number;
    status?: string;
    requestedBy?: mongoose.Types.ObjectId | string;
    requestedAt?: Date;
    targetNextApptId?: mongoose.Types.ObjectId | string;
    consentRequestedAt?: Date;
    consentExpiresAt?: Date;
    consentBy?: mongoose.Types.ObjectId | string;
    consentResponse?: string;
    appliedAt?: Date;
    reason?: string;
    adminNote?: string;
  };
  // Meta for check-in, reschedule, no-show handling
  meta?: {
    patientCheckedInAt?: Date;
    doctorCheckedInAt?: Date;
    graceUntil?: Date;
    reschedule?: {
      proposedBy?: "doctor" | "patient";
      proposedSlots?: string[];
      expiresAt?: Date;
      accepted?: boolean;
    };
    reason?: string;
    refund?: {
      status?: "none" | "pending" | "succeeded" | "failed";
      amount?: number;
      paymentId?: string;
    };
  };
}

const AppointmentSchema: Schema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorSchedule",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.BOOKED,
    },
    symptoms: { type: String },
    note: { type: String },
    appointmentTime: { type: String, required: true },
    appointmentDate: { type: String, required: true },

    // Patient contact info from booking form
    patientInfo: {
      name: { type: String },
      phone: { type: String },
      email: { type: String }
    },

    // Payment fields
    consultationFee: { type: Number, min: 0 },
    depositAmount: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
    insuranceCoverage: { type: Number, min: 0, default: 0 },
    patientAmount: { type: Number, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },

    // Doctor decision
    doctorDecision: {
      type: String,
      enum: ["approved", "reschedule", "rejected"],
    },
    doctorNotes: String,
    rescheduleReason: String,
    rejectionReason: String,
    newScheduleId: { type: Schema.Types.ObjectId, ref: "DoctorSchedule" },

    // Consultation details
    diagnosis: String,
    prescription: String,
    additionalServices: [
      {
        name: { type: String, required: true },
        cost: { type: Number, required: true, min: 0 },
        description: String,
      },
    ],

    // Timestamps
    bookedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "system"],
    },
    cancellationReason: String,
    // Extension request/consent flow (doctor requests extra minutes)
    extension: {
      minutes: { type: Number },
      status: {
        type: String,
        enum: [
          "requested",
          "consent_pending",
          "accepted",
          "declined",
          "applied",
          "cancelled",
          "timeout",
          "escalated",
        ],
      },
      requestedBy: { type: Schema.Types.ObjectId, ref: "Doctor" },
      requestedAt: Date,
      targetNextApptId: { type: Schema.Types.ObjectId, ref: "Appointment" },
      consentRequestedAt: Date,
      consentExpiresAt: Date,
      consentBy: { type: Schema.Types.ObjectId, ref: "Patient" },
      consentResponse: { type: String },
      appliedAt: Date,
      reason: String,
      adminNote: String,
    },
    // Appointment mode: online or offline
    mode: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    meetingLink: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAppointment>("Appointment", AppointmentSchema);
