import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  specialty: string;
  experience?: number;
  workplace?: string;
  license: string;
  description?: string;
  avatar?: string;
  education?: string[];
  certifications?: string[];
  languages?: string[];
  consultationFee?: number;
  status?: "pending" | "approved" | "rejected";
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const DoctorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    specialty: { type: String, required: true },
    experience: { type: Number },
    workplace: { type: String },
    license: { type: String, required: true },
    description: { type: String },
    avatar: { type: String },
    education: [{ type: String }],
    certifications: [{ type: String }],
    languages: [{ type: String }],
    consultationFee: { type: Number },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
DoctorSchema.pre("save", async function (next) {
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
DoctorSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, (this as any).password);
};

export default mongoose.model<IDoctor>("Doctor", DoctorSchema);
