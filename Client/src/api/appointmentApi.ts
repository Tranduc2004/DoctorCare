import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const getDoctorSchedules = (doctorId: string) =>
  axios
    .get(`${BASE_URL}/doctor/schedule/${doctorId}/schedules`)
    .then((r) => r.data);

export const createAppointment = (data: {
  patientId: string;
  doctorId: string;
  scheduleId: string;
  symptoms?: string;
  note?: string;
}) => axios.post(`${BASE_URL}/patient/appointments`, data).then((r) => r.data);

export const getMyAppointments = (patientId: string) =>
  axios
    .get(`${BASE_URL}/patient/appointments`, { params: { patientId } })
    .then((r) => r.data);
