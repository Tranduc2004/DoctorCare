import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Admin auth APIs
export const adminLogin = async (data: {
  username: string;
  password: string;
}) => {
  return axios.post(`${API_URL}/admin/auth/login`, data);
};

export const adminGetProfile = async (token: string) => {
  return axios.get(`${API_URL}/admin/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Helpers
const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// Admin: User management APIs
export const adminGetAllUsers = async (token: string) => {
  return axios.get(`${API_URL}/admin/users`, authHeader(token));
};

export const adminGetUsersByRole = async (token: string, role: string) => {
  return axios.get(`${API_URL}/admin/users/role/${role}`, authHeader(token));
};

export const adminGetDoctorsByStatus = async (
  token: string,
  status?: "pending" | "approved" | "rejected"
) => {
  const qs = status ? `?status=${status}` : "";
  return axios.get(
    `${API_URL}/admin/users/role/doctor${qs}`,
    authHeader(token)
  );
};

export const adminUpdateUser = async (
  token: string,
  id: string,
  data: Record<string, unknown>
) => {
  return axios.put(`${API_URL}/admin/users/${id}`, data, authHeader(token));
};

export const adminDeleteUser = async (token: string, id: string) => {
  return axios.delete(`${API_URL}/admin/users/${id}`, authHeader(token));
};

export const adminGetUserStats = async (token: string) => {
  return axios.get(`${API_URL}/admin/users/stats`, authHeader(token));
};

// Create patients/doctors using module auth register endpoints
export const createPatient = async (
  token: string,
  data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
  }
) => {
  // These endpoints may not require token, but we include if needed by server policy
  return axios.post(
    `${API_URL}/patient/auth/register`,
    data,
    authHeader(token)
  );
};

export const createDoctor = async (
  token: string,
  data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    specialty: string;
    experience?: number;
    workplace?: string;
    description?: string;
    education?: string[];
    certifications?: string[];
    languages?: string[];
    consultationFee?: number;
  }
) => {
  return axios.post(`${API_URL}/doctor/auth/register`, data, authHeader(token));
};

export const adminGetUserById = async (token: string, id: string) => {
  return axios.get(`${API_URL}/admin/users/${id}`, authHeader(token));
};

// Admin: Doctor schedules
export const adminCreateDoctorShift = async (
  token: string,
  data: { doctorId: string; date: string; startTime: string; endTime: string }
) => {
  return axios.post(`${API_URL}/admin/schedules`, data, authHeader(token));
};

export const adminBulkCreateDoctorShifts = async (
  token: string,
  data: {
    doctorId: string;
    slots: { date: string; startTime: string; endTime: string }[];
  }
) => {
  return axios.post(`${API_URL}/admin/schedules/bulk`, data, authHeader(token));
};

export const adminGetDoctorShifts = async (
  token: string,
  doctorId: string,
  params?: { from?: string; to?: string }
) => {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString() ? `?${search.toString()}` : "";
  return axios.get(
    `${API_URL}/admin/schedules/${doctorId}${qs}`,
    authHeader(token)
  );
};

export const adminGetAllShifts = async (
  token: string,
  params?: { from?: string; to?: string }
) => {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString() ? `?${search.toString()}` : "";
  return axios.get(`${API_URL}/admin/schedules${qs}`, authHeader(token));
};

export const adminUpdateDoctorShift = async (
  token: string,
  id: string,
  data: Partial<{ date: string; startTime: string; endTime: string }>
) => {
  return axios.put(`${API_URL}/admin/schedules/${id}`, data, authHeader(token));
};

export const adminDeleteDoctorShift = async (token: string, id: string) => {
  return axios.delete(`${API_URL}/admin/schedules/${id}`, authHeader(token));
};

// Admin: Lấy các ca cần xử lý (pending, rejected, busy)
export const adminGetPendingShifts = async (token: string) => {
  return axios.get(`${API_URL}/admin/schedules/pending/all`, authHeader(token));
};

// Admin: Thay thế bác sĩ cho ca làm việc
export const adminReplaceDoctor = async (
  token: string,
  id: string,
  data: { newDoctorId: string; adminNote?: string; forceReplace?: boolean }
) => {
  return axios.post(
    `${API_URL}/admin/schedules/${id}/replace-doctor`,
    data,
    authHeader(token)
  );
};

// Admin: Service management APIs
export const adminGetAllServices = async (token: string) => {
  return axios.get(`${API_URL}/admin/services`, authHeader(token));
};

export const adminGetServiceById = async (token: string, id: string) => {
  return axios.get(`${API_URL}/admin/services/${id}`, authHeader(token));
};

export const adminCreateService = async (
  token: string,
  data: {
    name: string;
    description: string;
    price: number;
    duration: number;
  }
) => {
  return axios.post(`${API_URL}/admin/services`, data, authHeader(token));
};

export const adminUpdateService = async (
  token: string,
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    duration: number;
    isActive: boolean;
  }>
) => {
  return axios.put(`${API_URL}/admin/services/${id}`, data, authHeader(token));
};

export const adminDeleteService = async (token: string, id: string) => {
  return axios.delete(`${API_URL}/admin/services/${id}`, authHeader(token));
};

export const adminSearchServices = async (token: string, query: string) => {
  return axios.get(
    `${API_URL}/admin/services/search?q=${query}`,
    authHeader(token)
  );
};

export const adminGetActiveServices = async (token: string) => {
  return axios.get(`${API_URL}/admin/services/active/list`, authHeader(token));
};

// Admin: Specialty management APIs
export const adminGetAllSpecialties = async (token: string) => {
  return axios.get(`${API_URL}/admin/specialties`, authHeader(token));
};

export const adminGetSpecialtyById = async (token: string, id: string) => {
  return axios.get(`${API_URL}/admin/specialties/${id}`, authHeader(token));
};

export const adminCreateSpecialty = async (
  token: string,
  data: {
    name: string;
    description: string;
  }
) => {
  return axios.post(`${API_URL}/admin/specialties`, data, authHeader(token));
};

export const adminUpdateSpecialty = async (
  token: string,
  id: string,
  data: Partial<{
    name: string;
    description: string;
    isActive: boolean;
  }>
) => {
  return axios.put(
    `${API_URL}/admin/specialties/${id}`,
    data,
    authHeader(token)
  );
};

export const adminDeleteSpecialty = async (token: string, id: string) => {
  return axios.delete(`${API_URL}/admin/specialties/${id}`, authHeader(token));
};

export const adminSearchSpecialties = async (token: string, query: string) => {
  return axios.get(
    `${API_URL}/admin/specialties/search?q=${query}`,
    authHeader(token)
  );
};

export const adminGetActiveSpecialties = async (token: string) => {
  return axios.get(
    `${API_URL}/admin/specialties/active/list`,
    authHeader(token)
  );
};

// Admin: Appointments management APIs
export const adminGetAllAppointments = async (
  token: string,
  params?: {
    status?: string;
    from?: string;
    to?: string;
    doctorId?: string;
    patientId?: string;
  }
) => {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.doctorId) search.set("doctorId", params.doctorId);
  if (params?.patientId) search.set("patientId", params.patientId);
  const qs = search.toString() ? `?${search.toString()}` : "";
  return axios.get(`${API_URL}/admin/appointments${qs}`, authHeader(token));
};

export const adminUpdateAppointmentStatus = async (
  token: string,
  id: string,
  status:
    | "pending"
    | "confirmed"
    | "examining"
    | "prescribing"
    | "done"
    | "cancelled"
) => {
  return axios.put(
    `${API_URL}/admin/appointments/status/${id}`,
    { status },
    authHeader(token)
  );
};

export const adminDeleteAppointment = async (token: string, id: string) => {
  return axios.delete(`${API_URL}/admin/appointments/${id}`, authHeader(token));
};

export const adminGetAppointmentStats = async (token: string) => {
  return axios.get(`${API_URL}/admin/appointments/stats`, authHeader(token));
};
