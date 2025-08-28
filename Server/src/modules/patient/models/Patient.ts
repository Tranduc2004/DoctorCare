import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IPatient extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  avatar?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const PatientSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
    medicalHistory: [{ type: String }],
    allergies: [{ type: String }],
    avatar: { type: String },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
PatientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    // Sử dụng type assertion với this as any để tránh lỗi TypeScript
    (this as any).password = await bcrypt.hash((this as any).password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
PatientSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, (this as any).password);
};

export default mongoose.model<IPatient>("Patient", PatientSchema);
