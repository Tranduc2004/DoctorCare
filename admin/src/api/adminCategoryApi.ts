import axios from "axios";

const API_URL = "http://localhost:5000/api";

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// Admin: Category management APIs
export const adminGetAllCategories = async (token: string) => {
  return axios.get(`${API_URL}/admin/categories`, authHeader(token));
};

export const adminGetCategoryById = async (token: string, id: string) => {
  return axios.get(`${API_URL}/admin/categories/${id}`, authHeader(token));
};

export const adminCreateCategory = async (
  token: string,
  data: {
    name: string;
    description?: string;
  }
) => {
  return axios.post(`${API_URL}/admin/categories`, data, authHeader(token));
};

export const adminUpdateCategory = async (
  token: string,
  id: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
) => {
  return axios.put(
    `${API_URL}/admin/categories/${id}`,
    data,
    authHeader(token)
  );
};

export const adminDeleteCategory = async (token: string, id: string) => {
  return axios.delete(`${API_URL}/admin/categories/${id}`, authHeader(token));
};

export const adminGetActiveCategories = async (token: string) => {
  return axios.get(`${API_URL}/admin/categories/approved`, authHeader(token));
};
