import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Helper to get auth headers
const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to log requests
apiClient.interceptors.request.use(
  (config) => {
    console.log("API Request:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      params: config.params,
    });
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
    });

    if (error.response?.status === 401) {
      console.warn("Unauthorized access - token may be invalid or expired");
      // Có thể dispatch logout action ở đây
    }

    return Promise.reject(error);
  }
);

// Medical Records API Types
export interface MedicalRecordFilters {
  page?: number;
  limit?: number;
  status?: string;
  doctorId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  consultationType?: string;
}

export interface MedicalRecordStats {
  overview: {
    totalRecords: number;
    recordsInPeriod: number;
    completedRecords: number;
    draftRecords: number;
    onlineRecords: number;
    offlineRecords: number;
  };
  charts: {
    recordsByDay: Array<{ _id: string; count: number }>;
    topDoctors: Array<{
      count: number;
      doctor: { name: string; specialty: string };
    }>;
  };
}

// Get all medical records with filters
export const getMedicalRecords = async (
  token: string,
  filters: MedicalRecordFilters = {}
) => {
  console.log(
    "getMedicalRecords called with token:",
    token ? "Token present" : "No token"
  );
  const response = await apiClient.get(`/admin/medical-records`, {
    headers: getAuthHeaders(token),
    params: filters,
  });
  return response.data;
};

// Get medical record by ID
export const getMedicalRecordById = async (token: string, id: string) => {
  const response = await apiClient.get(`/admin/medical-records/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
};

// Get medical records statistics
export const getMedicalRecordsStats = async (
  token: string,
  period: string = "month"
) => {
  const response = await apiClient.get(`/admin/medical-records/stats`, {
    headers: getAuthHeaders(token),
    params: { period },
  });
  return response.data as MedicalRecordStats;
};

// Update medical record status
export const updateMedicalRecordStatus = async (
  token: string,
  id: string,
  status: string
) => {
  const response = await apiClient.patch(
    `/admin/medical-records/${id}/status`,
    { status },
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
};

// Delete medical record
export const deleteMedicalRecord = async (token: string, id: string) => {
  const response = await apiClient.delete(`/admin/medical-records/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
};

// Get medical records by patient
export const getMedicalRecordsByPatient = async (
  token: string,
  patientId: string,
  page: number = 1,
  limit: number = 10
) => {
  const response = await apiClient.get(
    `/admin/medical-records/patient/${patientId}`,
    {
      headers: getAuthHeaders(token),
      params: { page, limit },
    }
  );
  return response.data;
};

// Get medical records by doctor
export const getMedicalRecordsByDoctor = async (
  token: string,
  doctorId: string,
  page: number = 1,
  limit: number = 10
) => {
  const response = await apiClient.get(
    `/admin/medical-records/doctor/${doctorId}`,
    {
      headers: getAuthHeaders(token),
      params: { page, limit },
    }
  );
  return response.data;
};
