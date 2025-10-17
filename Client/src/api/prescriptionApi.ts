import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Prescription interfaces
export interface Medication {
  name: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: number;
  quantity: number;
  instructions: string;
}

export interface Prescription {
  _id: string;
  recordId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medications: Medication[];
  notes?: string;
  prescriptionDate: string;
  status: "active" | "completed" | "cancelled";
  doctor: {
    _id: string;
    name: string;
    specialty?: {
      name: string;
    };
    workplace?: string;
  };
  patient: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  medicalRecord?: {
    _id: string;
    diagnosis: string;
    preliminaryDiagnosis: string;
    consultationType: "online" | "offline";
    createdAt: string;
  };
}

export interface PrescriptionResponse {
  prescriptions: Prescription[];
  pagination?: {
    current: number;
    total: number;
    count: number;
    limit: number;
  };
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token =
    sessionStorage.getItem("patient_token") ||
    localStorage.getItem("patient_token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// API Functions

// Get patient prescriptions
export const getPatientPrescriptions = async (
  patientId: string,
  page: number = 1,
  limit: number = 10
): Promise<PrescriptionResponse> => {
  try {
    const response = await axios.get(`${API_URL}/patient/prescriptions`, {
      params: { patientId, page, limit },
      ...getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error);
    throw error;
  }
};

// Get prescription detail
export const getPrescriptionDetail = async (
  prescriptionId: string,
  patientId: string
): Promise<Prescription> => {
  try {
    const response = await axios.get(
      `${API_URL}/patient/prescriptions/${prescriptionId}`,
      {
        params: { patientId },
        ...getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching prescription detail:", error);
    throw error;
  }
};

// Search prescriptions by medication name or doctor
export const searchPrescriptions = async (
  patientId: string,
  query: string,
  page: number = 1,
  limit: number = 10
): Promise<PrescriptionResponse> => {
  try {
    const response = await axios.get(
      `${API_URL}/patient/prescriptions/search`,
      {
        params: { patientId, query, page, limit },
        ...getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error searching prescriptions:", error);
    throw error;
  }
};

// Get prescriptions by date range
export const getPrescriptionsByDateRange = async (
  patientId: string,
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 10
): Promise<PrescriptionResponse> => {
  try {
    const response = await axios.get(
      `${API_URL}/patient/prescriptions/date-range`,
      {
        params: { patientId, startDate, endDate, page, limit },
        ...getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching prescriptions by date range:", error);
    throw error;
  }
};

// Get prescriptions by status
export const getPrescriptionsByStatus = async (
  patientId: string,
  status: "active" | "completed" | "cancelled",
  page: number = 1,
  limit: number = 10
): Promise<PrescriptionResponse> => {
  try {
    const response = await axios.get(
      `${API_URL}/patient/prescriptions/status`,
      {
        params: { patientId, status, page, limit },
        ...getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching prescriptions by status:", error);
    throw error;
  }
};
