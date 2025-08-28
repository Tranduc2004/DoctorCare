import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Patient auth APIs
export const patientLogin = async (data: { email: string; password: string }) => {
  return axios.post(`${API_URL}/patient/auth/login`, data);
};

export const patientRegister = async (data: FormData) => {
  return axios.post(`${API_URL}/patient/auth/register`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Doctor auth APIs
export const doctorLogin = async (data: { email: string; password: string }) => {
  return axios.post(`${API_URL}/doctor/auth/login`, data);
};

export const doctorRegister = async (data: FormData) => {
  return axios.post(`${API_URL}/doctor/auth/register`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
