import mongoose, { Schema, Document } from "mongoose";

export interface IInsurance extends Document {
  patientId: mongoose.Types.ObjectId;
  // Thông tin cơ bản BHYT
  provider?: string; // Cơ quan BHYT
  policyNumber?: string; // Số thẻ BHYT (10 ký tự)
  validFrom?: string; // YYYY-MM-DD
  validTo?: string; // YYYY-MM-DD
  regionCode?: string; // Mã KCB ban đầu
  imageUrl?: string; // ảnh thẻ BHYT

  // Thông tin bổ sung
  coverageRate?: number; // Mức hưởng BHYT (%, ví dụ: 80, 95, 100)
  managementCode?: string; // Mã đơn vị quản lý
  participantType?: string; // Đối tượng tham gia (HS-SV, người lao động, etc)
  householdRole?: string; // Mối quan hệ chủ hộ nếu tham gia theo hộ
  notes?: string; // Ghi chú (tự nguyện, chuyển tuyến, etc)

  // Verification status
  verificationStatus: "pending" | "verified" | "rejected" | "expired";
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId; // reference to Admin
  verificationNotes?: string;
  rejectionReason?: string;

  // Audit
  submittedAt: Date;
  submittedBy?: mongoose.Types.ObjectId; // reference to User/Admin who submitted
  lastEditedBy?: mongoose.Types.ObjectId;
  auditLog?: Array<{
    action: string;
    timestamp: Date;
    userId: mongoose.Types.ObjectId;
    details?: string;
  }>;
}

const InsuranceSchema = new Schema<IInsurance>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
    },
    // Basic insurance info
    provider: String,
    policyNumber: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || (v.length >= 8 && v.length <= 12); // Either empty or 8-12 chars
        },
        message: "Mã số BHYT phải có từ 8-12 ký tự",
      },
    },
    validFrom: String,
    validTo: String,
    regionCode: String,
    imageUrl: String,

    // Additional info
    coverageRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    managementCode: String,
    participantType: String,
    householdRole: String,
    notes: String,

    // Verification
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected", "expired"],
      default: "pending",
    },
    verifiedAt: Date,
    verifiedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    verificationNotes: String,
    rejectionReason: String,

    // Audit
    submittedAt: { type: Date, default: Date.now },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: "User" },
    auditLog: [
      {
        action: String,
        timestamp: { type: Date, default: Date.now },
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        details: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IInsurance>("Insurance", InsuranceSchema);
