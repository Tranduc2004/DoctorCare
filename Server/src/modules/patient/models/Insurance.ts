import mongoose, { Schema, Document } from "mongoose";

export interface IInsurance extends Document {
  patientId: mongoose.Types.ObjectId;
  provider?: string; // Cơ quan BHYT
  policyNumber?: string; // Số thẻ
  validFrom?: string; // YYYY-MM-DD
  validTo?: string; // YYYY-MM-DD
  regionCode?: string; // Mã KCB ban đầu
  imageUrl?: string; // ảnh thẻ
}

const InsuranceSchema = new Schema<IInsurance>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
    },
    provider: String,
    policyNumber: String,
    validFrom: String,
    validTo: String,
    regionCode: String,
    imageUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model<IInsurance>("Insurance", InsuranceSchema);
