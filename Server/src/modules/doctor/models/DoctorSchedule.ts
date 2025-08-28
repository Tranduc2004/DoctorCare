import mongoose, { Document, Schema } from "mongoose";

export interface IDoctorSchedule extends Document {
  doctorId: mongoose.Types.ObjectId;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  status: "pending" | "accepted" | "rejected" | "busy";
  rejectionReason?: string;
  busyReason?: string;
  adminNote?: string;
}

const DoctorScheduleSchema: Schema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "rejected", "busy"], 
      default: "pending" 
    },
    rejectionReason: { type: String },
    busyReason: { type: String },
    adminNote: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IDoctorSchedule>(
  "DoctorSchedule",
  DoctorScheduleSchema
);
