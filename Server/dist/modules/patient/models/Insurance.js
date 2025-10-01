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
const InsuranceSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        unique: true,
    },
    // Basic insurance info
    provider: String,
    policyNumber: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || (v.length >= 8 && v.length <= 12); // Either empty or 8-12 chars
            },
            message: "Mã số BHYT phải có từ 8-12 ký tự",
        },
    },
    validFrom: String,
    validTo: String,
    regionCode: String,
    imageUrl: String,
    // Additional info
    coverageRate: {
        type: Number,
        min: 0,
        max: 100,
    },
    managementCode: String,
    participantType: String,
    householdRole: String,
    notes: String,
    // Verification
    verificationStatus: {
        type: String,
        enum: ["pending", "verified", "rejected", "expired"],
        default: "pending",
    },
    verifiedAt: Date,
    verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    verificationNotes: String,
    rejectionReason: String,
    // Audit
    submittedAt: { type: Date, default: Date.now },
    submittedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    lastEditedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    auditLog: [
        {
            action: String,
            timestamp: { type: Date, default: Date.now },
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            details: String,
        },
    ],
}, { timestamps: true });
exports.default = mongoose_1.default.model("Insurance", InsuranceSchema);
