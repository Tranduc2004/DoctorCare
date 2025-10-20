import axios from "axios";
const API_URL = "http://localhost:5000/api";

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const adminGetPendingMedicines = async (
  token: string,
  params?: { page?: number; limit?: number }
) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const q = qs.toString() ? `?${qs.toString()}` : "";
  return axios.get(`${API_URL}/admin/medicines/pending${q}`, authHeader(token));
};

export const adminApproveMedicine = async (token: string, id: string) => {
  return axios.put(
    `${API_URL}/admin/medicines/${id}/approve`,
    {},
    authHeader(token)
  );
};

export const adminRejectMedicine = async (
  token: string,
  id: string,
  reason?: string
) => {
  return axios.put(
    `${API_URL}/admin/medicines/${id}/reject`,
    { reason },
    authHeader(token)
  );
};

// Medicine Management APIs
export const adminGetAllMedicines = async (
  token: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
    manufacturer?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.search) qs.set("search", params.search);
  if (params?.status) qs.set("status", params.status);
  if (params?.categoryId) qs.set("categoryId", params.categoryId);
  if (params?.manufacturer) qs.set("manufacturer", params.manufacturer);
  if (params?.sortBy) qs.set("sortBy", params.sortBy);
  if (params?.sortOrder) qs.set("sortOrder", params.sortOrder);
  
  const q = qs.toString() ? `?${qs.toString()}` : "";
  return axios.get(`${API_URL}/admin/medicines${q}`, authHeader(token));
};

export const adminGetMedicineById = async (token: string, id: string) => {
  return axios.get(`${API_URL}/admin/medicines/${id}`, authHeader(token));
};

export const adminCreateMedicine = async (token: string, medicineData: any) => {
  return axios.post(`${API_URL}/admin/medicines`, medicineData, authHeader(token));
};

export const adminUpdateMedicine = async (token: string, id: string, medicineData: any) => {
  return axios.put(`${API_URL}/admin/medicines/${id}`, medicineData, authHeader(token));
};

export const adminDeleteMedicine = async (token: string, id: string) => {
  return axios.delete(`${API_URL}/admin/medicines/${id}`, authHeader(token));
};

export const adminGetMedicineStatistics = async (token: string) => {
  return axios.get(`${API_URL}/admin/medicines/statistics`, authHeader(token));
};