import mongoose, { Schema, Document } from "mongoose";

export interface IDoctorTariff extends Document {
  doctorId?: mongoose.Types.ObjectId | null;
  specialty?: string | null;
  serviceCode: string;
  feeType: "flat" | "per_15min";
  baseFee?: number;
  unitFee?: number;
  minFee?: number;
  maxFee?: number;
  afterHoursMultiplier?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  status?: "active" | "inactive";
}

const DoctorTariffSchema: Schema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", default: null },
    specialty: { type: String, default: null },
    serviceCode: { type: String, required: true },
    feeType: { type: String, enum: ["flat", "per_15min"], required: true },
    baseFee: { type: Number, default: 0 },
    unitFee: { type: Number, default: 0 },
    minFee: { type: Number, default: 0 },
    maxFee: { type: Number, default: Number.MAX_SAFE_INTEGER },
    afterHoursMultiplier: { type: Number, default: 1 },
    effectiveFrom: Date,
    effectiveTo: Date,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

DoctorTariffSchema.index(
  { doctorId: 1, serviceCode: 1 },
  { unique: true, sparse: true }
);
DoctorTariffSchema.index({ specialty: 1, serviceCode: 1 });

export default mongoose.model<IDoctorTariff>(
  "DoctorTariff",
  DoctorTariffSchema
);
