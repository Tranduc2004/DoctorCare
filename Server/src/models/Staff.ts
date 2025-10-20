import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Staff interface
export interface IStaff extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "staff";
  active: boolean;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Staff schema
const staffSchema = new Schema<IStaff>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },
    active: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: String,
      ref: "Admin",
    },
    approvedAt: {
      type: Date,
    },
    rejectedReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "staffs", // Use collection name with 's'
  }
);

// Index for better performance
staffSchema.index({ email: 1 });
staffSchema.index({ status: 1 });
staffSchema.index({ active: 1 });

// Hash password before saving
staffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
staffSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create model using the existing mongoose connection from server
export const Staff = mongoose.model<IStaff>("Staff", staffSchema);
