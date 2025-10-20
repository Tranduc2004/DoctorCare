import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api", // Pharmacy service API
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("pharmacy_token") ||
      sessionStorage.getItem("pharmacy_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens
      localStorage.removeItem("pharmacy_token");
      sessionStorage.removeItem("pharmacy_token");
      localStorage.removeItem("pharmacyUser");

      // Only redirect if not already on login page
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        console.log("Authentication failed, redirecting to login");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
export interface LoginData {
  username: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  fullName?: string;
  role?: string;
}

export interface Staff {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  fullName?: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const authApi = {
  login: async (data: LoginData) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get("/auth/verify");
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};

export default api;
