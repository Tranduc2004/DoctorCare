import { IPrescriptionItem } from "./medicalRecord";

export interface AppointmentMedicalRecord {
  _id: string;
  treatment?: string;
  diagnosis?: string;
  status:
    | "draft"
    | "in_progress"
    | "prescription_issued"
    | "completed"
    | "final";
  prescription?: {
    medications: IPrescriptionItem[];
    notes?: string;
  };
  reasonForVisit: string;
  chiefComplaint: string;
  clinicalExamination?: string;
  finalDiagnosis?: string;
  differentialDiagnosis?: string;
}

export interface AppointmentWithMedicalRecord {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  patientInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  scheduleId: {
    _id: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
  mode?: "online" | "offline" | string;
  status: string;
  symptoms?: string;
  note?: string;
  createdAt: string;
  medicalRecord?: AppointmentMedicalRecord;
}
