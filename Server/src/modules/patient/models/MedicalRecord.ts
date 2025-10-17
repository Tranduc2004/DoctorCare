import mongoose, { Document, Schema } from "mongoose";

export interface IMedicalRecord extends Document {
  // Liên kết cơ bản
  appointmentId?: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;

  // A) Xác nhận & Hành chính
  appointmentCode?: string;
  consultationType: "online" | "offline";
  patientInfo: {
    fullName: string;
    birthYear?: number;
    gender?: "male" | "female" | "other";
    insuranceNumber?: string;
    insuranceValidFrom?: string;
    insuranceValidTo?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };

  // B) Sàng lọc nhanh
  quickScreening?: {
    identityVerified?: boolean;
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
    bmi?: number;
    allergies?: {
      hasAllergies: boolean;
      allergyList?: string;
    };
    currentMedications?: string;
    pregnancyStatus?: {
      isPregnant?: boolean;
      isBreastfeeding?: boolean;
      gestationalWeeks?: number;
    };
    receptionNotes?: string;
  };

  // Legacy fields for backward compatibility
  vitals?: {
    height?: number; // cm
    weight?: number; // kg
    bmi?: number;
    temperature?: number; // °C
    pulse?: number; // bpm
    bloodPressure?: string; // "120/80"
    spO2?: number; // %
  };
  allergies?: string;
  currentMedications?: string;
  pregnancyStatus?: "yes" | "no" | "unknown";
  receptionNotes?: string;

  // C) Lý do khám & Triệu chứng
  reasonForVisit: string;
  chiefComplaint: string;
  symptomDetails?: {
    location?: string;
    onset?: string;
    duration?: string;
    severity?: number; // 0-10
    character?: string;
    aggravatingFactors?: string;
    relievingFactors?: string;
    associatedSymptoms?: string;
    previousTreatment?: string;
    painScale?: number;
    functionalImpact?: string;
    timeline?: string;
    triggers?: string;
    notes?: string;
  };

  // Legacy fields for backward compatibility
  symptomLocation?: string;
  symptomOnset?: string;
  painScale?: number; // 0-10
  aggravatingFactors?: string;
  relievingFactors?: string;
  attachments?: string[]; // URLs to images/files

  // D) Tiền sử & Yếu tố liên quan
  medicalHistory?: {
    pastMedicalHistory?: string;
    surgicalHistory?: string;
    familyHistory?: string;
    socialHistory?: {
      smoking?: string;
      alcohol?: string;
      occupation?: string;
      other?: string;
    };
    syncFromPrevious?: boolean;
  };
  // Legacy fields for backward compatibility
  surgicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  riskFactors?: string[];

  // E) Khám lâm sàng
  generalExamination?: string;
  systemicExamination?: {
    cardiovascular?: string;
    respiratory?: string;
    gastrointestinal?: string;
    neurological?: string;
    dermatological?: string;
    other?: string;
  };
  clinicalExamination?: {
    generalAppearance?: string;
    consciousness?: string;
    nutrition?: string;
    skinMucosa?: string;
    cardiovascular?: string;
    respiratory?: string;
    gastrointestinal?: string;
    neurological?: string;
    musculoskeletal?: string;
    genitourinary?: string;
    examinationNotes?: string;
  };
  clinicalImages?: string[];

  // F) Chỉ định cận lâm sàng
  paraclinicalIndications?: {
    laboratoryTests?: {
      tests?: string[];
      notes?: string;
    };
    imagingStudies?: {
      studies?: string[];
      notes?: string;
    };
    procedures?: {
      procedures?: string[];
      notes?: string;
    };
    consultations?: string;
    resultLocation?: string;
    attachedResults?: string[];
  };

  // Legacy field for backward compatibility
  labTests?: {
    type: "lab" | "imaging" | "procedure";
    name: string;
    priority: "stat" | "routine";
    notes?: string;
    estimatedCost?: number;
  }[];

  // G) Đánh giá & Chẩn đoán
  preliminaryDiagnosis: string;
  icdCodes?: string[];
  differentialDiagnosis?: string;
  treatmentPlan?: string;

  // Kết quả cuối cùng
  diagnosis: string;
  finalDiagnosis?: string; // Add finalDiagnosis field for compatibility
  treatment: string;
  prescription?: {
    medications?: Array<{
      name: string;
      strength: string;
      form: string;
      dosage: string;
      frequency: string;
      duration: number;
      quantity: number;
      instructions: string;
    }>;
    prescriptionIssued?: boolean;
    prescriptionPdfUrl?: string;
    notes?: string;
  };

  // Theo dõi & an toàn
  followUpCare?: {
    instructions?: string;
    warningSignsEducation?: string;
    nextAppointment?: {
      date?: string;
      notes?: string;
    };
    emergencyContacts?: string;
  };

  // Legacy fields for backward compatibility
  followUpDate?: Date;
  followUpInstructions?: string;

  // Tệp đính kèm & xuất bản
  documents?: {
    attachments?: string[];
    visitSummaryPdfUrl?: string;
    prescriptionPdfUrl?: string;
  };

  // Nhật ký & kiểm soát
  audit?: Array<{
    action: string;
    userId: string;
    timestamp: string;
    changes?: any;
  }>;
  locked?: boolean;

  // Xác nhận từ admin
  confirmationAdmin?: {
    appointmentConfirmed?: boolean;
    identityVerified?: boolean;
    insuranceChecked?: boolean;
    consentSigned?: boolean;
  };

  // Metadata
  status:
    | "draft"
    | "in_progress"
    | "prescription_issued"
    | "completed"
    | "final";
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

const MedicalRecordSchema: Schema = new Schema(
  {
    // Liên kết cơ bản
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      unique: true,
      sparse: true, // Allow null values but enforce uniqueness when present
    },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },

    // A) Xác nhận & Hành chính
    appointmentCode: String,
    consultationType: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    patientInfo: {
      fullName: { type: String, required: true },
      birthYear: Number,
      gender: { type: String, enum: ["male", "female", "other"] },
      insuranceNumber: String,
      insuranceValidFrom: String,
      insuranceValidTo: String,
      emergencyContactName: String,
      emergencyContactPhone: String,
    },

    // B) Sàng lọc nhanh
    quickScreening: {
      identityVerified: Boolean,
      temperature: Number,
      bloodPressure: String,
      heartRate: Number,
      weight: Number,
      height: Number,
      oxygenSaturation: Number,
      bmi: Number,
      allergies: {
        hasAllergies: Boolean,
        allergyList: String,
      },
      currentMedications: String,
      pregnancyStatus: {
        isPregnant: Boolean,
        isBreastfeeding: Boolean,
        gestationalWeeks: Number,
      },
      receptionNotes: String,
    },

    // Legacy fields for backward compatibility
    vitals: {
      height: Number,
      weight: Number,
      bmi: Number,
      temperature: Number,
      pulse: Number,
      bloodPressure: String,
      spO2: Number,
    },
    allergies: String,
    currentMedications: String,
    pregnancyStatus: { type: String, enum: ["yes", "no", "unknown"] },
    receptionNotes: String,

    // C) Lý do khám & Triệu chứng
    reasonForVisit: { type: String, required: true },
    chiefComplaint: { type: String, required: true },
    symptomDetails: {
      location: String,
      onset: String,
      duration: String,
      severity: { type: Number, min: 0, max: 10 },
      character: String,
      aggravatingFactors: String,
      relievingFactors: String,
      associatedSymptoms: String,
      previousTreatment: String,
      painScale: { type: Number, min: 0, max: 10 },
      functionalImpact: String,
      timeline: String,
      triggers: String,
      notes: String,
    },

    // Legacy fields for backward compatibility
    symptomLocation: String,
    symptomOnset: String,
    painScale: { type: Number, min: 0, max: 10 },
    aggravatingFactors: String,
    relievingFactors: String,
    attachments: [String],

    // D) Tiền sử & Yếu tố liên quan
    medicalHistory: {
      pastMedicalHistory: String,
      surgicalHistory: String,
      familyHistory: String,
      socialHistory: {
        smoking: String,
        alcohol: String,
        occupation: String,
        other: String,
      },
      syncFromPrevious: Boolean,
    },
    // Legacy fields for backward compatibility
    surgicalHistory: String,
    familyHistory: String,
    socialHistory: String,
    riskFactors: [String],

    // E) Khám lâm sàng
    generalExamination: String,
    systemicExamination: {
      cardiovascular: String,
      respiratory: String,
      gastrointestinal: String,
      neurological: String,
      dermatological: String,
      other: String,
    },
    clinicalExamination: {
      generalAppearance: String,
      consciousness: String,
      nutrition: String,
      skinMucosa: String,
      cardiovascular: String,
      respiratory: String,
      gastrointestinal: String,
      neurological: String,
      musculoskeletal: String,
      genitourinary: String,
      examinationNotes: String,
    },
    clinicalImages: [String],

    // F) Chỉ định cận lâm sàng
    paraclinicalIndications: {
      laboratoryTests: {
        tests: [String],
        notes: String,
      },
      imagingStudies: {
        studies: [String],
        notes: String,
      },
      procedures: {
        procedures: [String],
        notes: String,
      },
      consultations: String,
      resultLocation: String,
      attachedResults: [String],
    },

    // Legacy field for backward compatibility
    labTests: [
      {
        type: { type: String, enum: ["lab", "imaging", "procedure"] },
        name: String,
        priority: { type: String, enum: ["stat", "routine"] },
        notes: String,
        estimatedCost: Number,
      },
    ],

    // G) Đánh giá & Chẩn đoán
    preliminaryDiagnosis: { type: String, required: true },
    icdCodes: [String],
    differentialDiagnosis: String,
    treatmentPlan: String,

    // Kết quả cuối cùng
    diagnosis: { type: String, required: true },
    finalDiagnosis: String, // Add finalDiagnosis field for compatibility
    treatment: { type: String, required: true },
    prescription: {
      medications: [
        {
          name: String,
          strength: String,
          form: String,
          dosage: String,
          frequency: String,
          duration: Number,
          quantity: Number,
          instructions: String,
        },
      ],
      prescriptionIssued: Boolean,
      prescriptionPdfUrl: String,
      notes: String,
    },

    // Theo dõi & an toàn
    followUpCare: {
      instructions: String,
      warningSignsEducation: String,
      nextAppointment: {
        date: String,
        notes: String,
      },
      emergencyContacts: String,
    },

    // Legacy fields for backward compatibility
    followUpDate: Date,
    followUpInstructions: String,

    // Tệp đính kèm & xuất bản
    documents: {
      attachments: [String],
      visitSummaryPdfUrl: String,
      prescriptionPdfUrl: String,
    },

    // Nhật ký & kiểm soát
    audit: [
      {
        action: String,
        userId: String,
        timestamp: String,
        changes: Schema.Types.Mixed,
      },
    ],
    locked: Boolean,

    // Xác nhận từ admin
    confirmationAdmin: {
      appointmentConfirmed: Boolean,
      identityVerified: Boolean,
      insuranceChecked: Boolean,
      consentSigned: Boolean,
    },

    // Metadata
    status: {
      type: String,
      enum: [
        "draft",
        "in_progress",
        "prescription_issued",
        "completed",
        "final",
      ],
      default: "draft",
    },
    completedAt: Date,
    notes: String,
    createdBy: String,
    lastModifiedBy: String,
  },
  { timestamps: true }
);

export default mongoose.model<IMedicalRecord>(
  "MedicalRecord",
  MedicalRecordSchema
);
