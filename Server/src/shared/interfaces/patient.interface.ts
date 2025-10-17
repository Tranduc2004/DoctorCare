import { Document } from "mongoose";

export interface IPatient extends Document {
  fullName: string;
  phone: string;
  email: string;
}
