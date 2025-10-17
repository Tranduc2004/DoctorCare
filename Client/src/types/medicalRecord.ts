export interface IPrescriptionItem {
  name: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: number;
  quantity: number;
  instructions: string;
}

export interface IMedicalRecord {
  _id: string;
  patientInfo: {
    fullName: string;
    birthYear: number;
    gender: string;
    insuranceNumber?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
  patient: string;
  doctor: string;
  appointmentId: string;
  reasonForVisit: string;
  chiefComplaint: string;
  clinicalExamination?: string;
  diagnosis?: string;
  treatment?: string;
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
  createdAt: string;
  updatedAt: string;
  finalDiagnosis?: string;
  differentialDiagnosis?: string;
}
