import mongoose, { Schema, Document } from "mongoose";

export type EncounterStatus =
  | "in_consult"
  | "prescription_issued"
  | "ready_to_discharge"
  | "completed";

export interface IEncounter extends Document {
  appointmentId?: mongoose.Types.ObjectId;
  encounterNumber: string;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  status: EncounterStatus;
  startedAt?: Date;
  completedAt?: Date;
  soap?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  vitals?: Record<string, any>;
  prescriptions?: Array<any>;
  summary?: string;
}

const EncounterSchema = new Schema<IEncounter>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    encounterNumber: { type: String, required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    status: {
      type: String,
      enum: [
        "in_consult",
        "prescription_issued",
        "ready_to_discharge",
        "completed",
      ],
      default: "in_consult",
    },
    startedAt: Date,
    completedAt: Date,
    soap: {
      subjective: String,
      objective: String,
      assessment: String,
      plan: String,
    },
    vitals: Schema.Types.Mixed,
    prescriptions: [Schema.Types.Mixed],
    summary: String,
  },
  { timestamps: true }
);

// Generate encounter number
EncounterSchema.pre("validate", async function (next) {
  if (this.isNew && !this.encounterNumber) {
    try {
      const count = await mongoose.model("Encounter").countDocuments();
      this.encounterNumber = `ENC-${Date.now()}-${String(count + 1).padStart(
        4,
        "0"
      )}`;
    } catch (err) {
      return next(err as any);
    }
  }
  next();
});

export default mongoose.model<IEncounter>("Encounter", EncounterSchema);
