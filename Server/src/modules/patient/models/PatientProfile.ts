import mongoose, { Schema, Document } from "mongoose";

export interface IPatientProfile extends Document {
  patientId: mongoose.Types.ObjectId;
  fullName?: string;
  dob?: string; // YYYY-MM-DD
  gender?: "male" | "female" | "other";
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
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  consentShareRecords?: boolean;
  consentNotifications?: boolean;
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
    fullName: String,
    dob: String,
    gender: { type: String, enum: ["male", "female", "other"] },
    address: String,
    phone: String,
    email: String,
    // Extended
    bloodType: String,
    heightCm: Number,
    weightKg: Number,
    allergies: String,
    chronicConditions: String,
    medications: String,
    preferredLanguage: String,
    emergencyContactName: String,
    emergencyContactPhone: String,
    consentShareRecords: { type: Boolean, default: true },
    consentNotifications: { type: Boolean, default: true },
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
