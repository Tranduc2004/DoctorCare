import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
  appointmentId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  senderRole: "doctor" | "patient";
  content: string;
  isReadByDoctor: boolean;
  isReadByPatient: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    senderRole: { type: String, enum: ["doctor", "patient"], required: true },
    content: { type: String, required: true, trim: true },
    isReadByDoctor: { type: Boolean, default: false },
    isReadByPatient: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ appointmentId: 1, createdAt: -1 });
MessageSchema.index({ doctorId: 1, patientId: 1, createdAt: -1 });

export default mongoose.model<IMessage>("Message", MessageSchema);
