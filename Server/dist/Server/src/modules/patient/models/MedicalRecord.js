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
const MedicalRecordSchema = new mongoose_1.Schema({
    // Liên kết cơ bản
    appointmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Appointment",
        unique: true,
        sparse: true, // Allow null values but enforce uniqueness when present
    },
    patient: { type: mongoose_1.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor", required: true },
    // A) Xác nhận & Hành chính
    appointmentCode: String,
    consultationType: {
        type: String,
        enum: ["online", "offline"],
        required: true,
    },
    patientInfo: {
        fullName: { type: String, required: true },
        birthYear: Number,
        gender: { type: String, enum: ["male", "female", "other"] },
        insuranceNumber: String,
        insuranceValidFrom: String,
        insuranceValidTo: String,
        emergencyContactName: String,
        emergencyContactPhone: String,
    },
    // B) Sàng lọc nhanh
    quickScreening: {
        identityVerified: Boolean,
        temperature: Number,
        bloodPressure: String,
        heartRate: Number,
        weight: Number,
        height: Number,
        oxygenSaturation: Number,
        bmi: Number,
        allergies: {
            hasAllergies: Boolean,
            allergyList: String,
        },
        currentMedications: String,
        pregnancyStatus: {
            isPregnant: Boolean,
            isBreastfeeding: Boolean,
            gestationalWeeks: Number,
        },
        receptionNotes: String,
    },
    // Legacy fields for backward compatibility
    vitals: {
        height: Number,
        weight: Number,
        bmi: Number,
        temperature: Number,
        pulse: Number,
        bloodPressure: String,
        spO2: Number,
    },
    allergies: String,
    currentMedications: String,
    pregnancyStatus: { type: String, enum: ["yes", "no", "unknown"] },
    receptionNotes: String,
    // C) Lý do khám & Triệu chứng
    reasonForVisit: { type: String, required: true },
    chiefComplaint: { type: String, required: true },
    symptomDetails: {
        location: String,
        onset: String,
        duration: String,
        severity: { type: Number, min: 0, max: 10 },
        character: String,
        aggravatingFactors: String,
        relievingFactors: String,
        associatedSymptoms: String,
        previousTreatment: String,
        painScale: { type: Number, min: 0, max: 10 },
        functionalImpact: String,
        timeline: String,
        triggers: String,
        notes: String,
    },
    // Legacy fields for backward compatibility
    symptomLocation: String,
    symptomOnset: String,
    painScale: { type: Number, min: 0, max: 10 },
    aggravatingFactors: String,
    relievingFactors: String,
    attachments: [String],
    // D) Tiền sử & Yếu tố liên quan
    medicalHistory: {
        pastMedicalHistory: String,
        surgicalHistory: String,
        familyHistory: String,
        socialHistory: {
            smoking: String,
            alcohol: String,
            occupation: String,
            other: String,
        },
        syncFromPrevious: Boolean,
    },
    // Legacy fields for backward compatibility
    surgicalHistory: String,
    familyHistory: String,
    socialHistory: String,
    riskFactors: [String],
    // E) Khám lâm sàng
    generalExamination: String,
    systemicExamination: {
        cardiovascular: String,
        respiratory: String,
        gastrointestinal: String,
        neurological: String,
        dermatological: String,
        other: String,
    },
    clinicalExamination: {
        generalAppearance: String,
        consciousness: String,
        nutrition: String,
        skinMucosa: String,
        cardiovascular: String,
        respiratory: String,
        gastrointestinal: String,
        neurological: String,
        musculoskeletal: String,
        genitourinary: String,
        examinationNotes: String,
    },
    clinicalImages: [String],
    // F) Chỉ định cận lâm sàng
    paraclinicalIndications: {
        laboratoryTests: {
            tests: [String],
            notes: String,
        },
        imagingStudies: {
            studies: [String],
            notes: String,
        },
        procedures: {
            procedures: [String],
            notes: String,
        },
        consultations: String,
        resultLocation: String,
        attachedResults: [String],
    },
    // Legacy field for backward compatibility
    labTests: [
        {
            type: { type: String, enum: ["lab", "imaging", "procedure"] },
            name: String,
            priority: { type: String, enum: ["stat", "routine"] },
            notes: String,
            estimatedCost: Number,
        },
    ],
    // G) Đánh giá & Chẩn đoán
    preliminaryDiagnosis: { type: String, required: true },
    icdCodes: [String],
    differentialDiagnosis: String,
    treatmentPlan: String,
    // Kết quả cuối cùng
    diagnosis: { type: String, required: true },
    finalDiagnosis: String, // Add finalDiagnosis field for compatibility
    treatment: { type: String, required: true },
    prescription: {
        medications: [
            {
                name: String,
                strength: String,
                form: String,
                dosage: String,
                frequency: String,
                duration: Number,
                quantity: Number,
                instructions: String,
            },
        ],
        prescriptionIssued: Boolean,
        prescriptionPdfUrl: String,
        notes: String,
    },
    // Theo dõi & an toàn
    followUpCare: {
        instructions: String,
        warningSignsEducation: String,
        nextAppointment: {
            date: String,
            notes: String,
        },
        emergencyContacts: String,
    },
    // Legacy fields for backward compatibility
    followUpDate: Date,
    followUpInstructions: String,
    // Tệp đính kèm & xuất bản
    documents: {
        attachments: [String],
        visitSummaryPdfUrl: String,
        prescriptionPdfUrl: String,
    },
    // Nhật ký & kiểm soát
    audit: [
        {
            action: String,
            userId: String,
            timestamp: String,
            changes: mongoose_1.Schema.Types.Mixed,
        },
    ],
    locked: Boolean,
    // Xác nhận từ admin
    confirmationAdmin: {
        appointmentConfirmed: Boolean,
        identityVerified: Boolean,
        insuranceChecked: Boolean,
        consentSigned: Boolean,
    },
    // Metadata
    status: {
        type: String,
        enum: [
            "draft",
            "in_progress",
            "prescription_issued",
            "completed",
            "final",
        ],
        default: "draft",
    },
    completedAt: Date,
    notes: String,
    createdBy: String,
    lastModifiedBy: String,
}, { timestamps: true });
exports.default = mongoose_1.default.model("MedicalRecord", MedicalRecordSchema);
