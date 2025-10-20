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
const PatientProfileSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        unique: true,
    },
    // Basic info
    fullName: String,
    dob: String,
    gender: { type: String, enum: ["male", "female", "other"] },
    idNumber: String,
    idType: { type: String, enum: ["cccd", "cmnd", "passport"] },
    idImageUrl: String,
    address: String,
    phone: String,
    email: String,
    // Medical info
    bloodType: String,
    heightCm: Number,
    weightKg: Number,
    allergies: String,
    chronicConditions: String,
    medications: String,
    preferredLanguage: String,
    // Emergency contact
    emergencyContactName: String,
    emergencyContactPhone: String,
    emergencyContactRelation: String,
    // Consents
    consentShareRecords: { type: Boolean, default: true },
    consentNotifications: { type: Boolean, default: true },
    // Metadata & Verification
    profileStatus: {
        type: String,
        enum: ["pending", "verified", "rejected", "expired"],
        default: "pending",
    },
    verifiedAt: Date,
    verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    verificationNotes: String,
    lastEditedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    auditLog: [
        {
            action: String,
            timestamp: { type: Date, default: Date.now },
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            details: String,
        },
    ],
    // Deprecated/grouped form
    emergencyContact: {
        name: String,
        phone: String,
        relation: String,
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("PatientProfile", PatientProfileSchema);
