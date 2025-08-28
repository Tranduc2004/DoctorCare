import mongoose, { Document, Schema } from "mongoose";

export interface IMedicalRecord extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  diagnosis: string;
  treatment: string;
  date: Date;
}

const MedicalRecordSchema: Schema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  diagnosis: { type: String, required: true },
  treatment: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model<IMedicalRecord>(
  "MedicalRecord",
  MedicalRecordSchema
);
