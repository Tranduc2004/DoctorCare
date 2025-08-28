import mongoose, { Document, Schema } from "mongoose";
import { AppointmentStatus } from "../types";

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  scheduleId: mongoose.Types.ObjectId;
  status: AppointmentStatus;
  symptoms?: string;
  note?: string;
}

const AppointmentSchema: Schema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorSchedule",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "examining", "prescribing", "done", "cancelled"],
      default: "pending",
    },
    symptoms: { type: String },
    note: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAppointment>("Appointment", AppointmentSchema);
