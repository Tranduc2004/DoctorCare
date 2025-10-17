import mongoose, { Schema } from "mongoose";

const BankAccountSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g., "Phòng khám ABC"
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    branch: { type: String },
    swift: { type: String },
    active: { type: Boolean, default: true },
    note: { type: String },
  },
  { timestamps: true }
);

const BankAccount = mongoose.model("BankAccount", BankAccountSchema);
export default BankAccount;
