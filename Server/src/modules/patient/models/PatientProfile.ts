import mongoose, { Schema, Document } from "mongoose";

export interface IPatientProfile extends Document {
  patientId: mongoose.Types.ObjectId;
  // Thông tin hành chính cơ bản
  fullName?: string;
  dob?: string; // YYYY-MM-DD
  gender?: "male" | "female" | "other";
  idNumber?: string; // CCCD/CMND/Passport
  idType?: "cccd" | "cmnd" | "passport";
  idImageUrl?: string; // URL to uploaded ID image
  address?: string;
  phone?: string;
  email?: string;

  // Extended medical/profile fields
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  heightCm?: number;
  weightKg?: number;
  allergies?: string; // comma-separated
  chronicConditions?: string; // comma-separated
  medications?: string; // comma-separated
  preferredLanguage?: string; // vi|en|...

  // Emergency contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Consents & Preferences
  consentShareRecords?: boolean;
  consentNotifications?: boolean;

  // Profile metadata
  profileStatus: "pending" | "verified" | "rejected" | "expired";
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId; // reference to Admin
  verificationNotes?: string;
  lastEditedBy?: mongoose.Types.ObjectId; // reference to User/Admin who last edited
  auditLog?: Array<{
    action: string;
    timestamp: Date;
    userId: mongoose.Types.ObjectId;
    details?: string;
  }>;

  // Backward compat: keep grouped emergency contact if ever used
  emergencyContact?: { name?: string; phone?: string; relation?: string };
}

const PatientProfileSchema = new Schema<IPatientProfile>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
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
    verifiedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    verificationNotes: String,
    lastEditedBy: { type: Schema.Types.ObjectId, ref: "User" },
    auditLog: [
      {
        action: String,
        timestamp: { type: Date, default: Date.now },
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        details: String,
      },
    ],

    // Deprecated/grouped form
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPatientProfile>(
  "PatientProfile",
  PatientProfileSchema
);
