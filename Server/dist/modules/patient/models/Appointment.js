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
const appointment_1 = require("../../../shared/types/appointment");
const AppointmentSchema = new mongoose_1.Schema({
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor", required: true },
    scheduleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "DoctorSchedule",
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(appointment_1.AppointmentStatus),
        default: appointment_1.AppointmentStatus.BOOKED,
    },
    symptoms: { type: String },
    note: { type: String },
    appointmentTime: { type: String, required: true },
    appointmentDate: { type: String, required: true },
    // Payment fields
    consultationFee: { type: Number, min: 0 },
    depositAmount: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
    insuranceCoverage: { type: Number, min: 0, default: 0 },
    patientAmount: { type: Number, min: 0 },
    paymentStatus: {
        type: String,
        enum: Object.values(appointment_1.PaymentStatus),
        default: appointment_1.PaymentStatus.PENDING,
    },
    // Doctor decision
    doctorDecision: {
        type: String,
        enum: ["approved", "reschedule", "rejected"],
    },
    doctorNotes: String,
    rescheduleReason: String,
    rejectionReason: String,
    newScheduleId: { type: mongoose_1.Schema.Types.ObjectId, ref: "DoctorSchedule" },
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
        requestedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor" },
        requestedAt: Date,
        targetNextApptId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Appointment" },
        consentRequestedAt: Date,
        consentExpiresAt: Date,
        consentBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Patient" },
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
}, { timestamps: true });
exports.default = mongoose_1.default.model("Appointment", AppointmentSchema);
