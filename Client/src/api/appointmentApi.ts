import axios from "axios";
import { Schedule, Appointment, ApiResponse } from "../types/api";

const BASE_URL = "http://localhost:5000/api";

// Add error handling interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      console.error("Network error - Backend server may be down");
      // Optional: Show user-friendly message
      // toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    }
    return Promise.reject(error);
  }
);

interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  scheduleId: string;
  symptoms?: string;
  note?: string;
  appointmentTime?: string;
  mode?: "online" | "offline";
}

interface CreateAppointmentResponse {
  success?: boolean;
  data?: Appointment;
  message?: string;
  holdExpiresAt?: string | Date;
}

export const getDoctorSchedules = (doctorId: string): Promise<Schedule[]> =>
  axios
    .get<Schedule[]>(`${BASE_URL}/doctor/schedule/${doctorId}/schedules`)
    .then((r) => r.data);

export const createAppointment = (
  data: CreateAppointmentData
): Promise<CreateAppointmentResponse> =>
  // Return the full server response so callers can access holdExpiresAt and message
  axios
    .post<CreateAppointmentResponse>(`${BASE_URL}/patient/appointments`, data)
    .then((r) => r.data);

export const getMyAppointments = async (
  patientId: string
): Promise<Appointment[]> => {
  if (!patientId) return [];

  try {
    const response = await axios.get<ApiResponse<Appointment[]>>(
      `${BASE_URL}/patient/appointments`,
      {
        params: { patientId },
        timeout: 5000,
      }
    );

    const appointments = response.data?.data || [];
    return appointments;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
};

export const getMyAppointmentHistory = (patientId: string) =>
  axios
    .get(`${BASE_URL}/patient/appointments/history`, { params: { patientId } })
    .then((r) => r.data);

// Profile APIs
export const getMyProfile = (patientId: string) =>
  axios
    .get(`${BASE_URL}/patient/profile/profile`, { params: { patientId } })
    .then((r) => r.data);

export const saveMyProfile = (
  patientId: string,
  profile: Record<string, unknown>
) =>
  axios
    .put(`${BASE_URL}/patient/profile/profile`, { patientId, profile })
    .then((r) => r.data);

export const saveMyInsurance = (
  patientId: string,
  insurance: Record<string, unknown>
) =>
  axios
    .put(`${BASE_URL}/patient/profile/insurance`, { patientId, insurance })
    .then((r) => r.data);

// Doctor APIs
export const getAppointmentsByDoctor = async (
  doctorId: string
): Promise<Appointment[]> => {
  if (!doctorId) return [];

  try {
    const response = await axios.get<Appointment[]>(
      `${BASE_URL}/doctor/appointments`,
      {
        params: { doctorId },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        timeout: 5000,
      }
    );

    return response.data || [];
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    return [];
  }
};

// Quick booking APIs for direct appointment booking from doctor page
export const quickBookAppointment = async (data: {
  patientId: string;
  doctorId: string;
  selectedDate: string;
  selectedTime: string;
  symptoms?: string;
  mode?: "online" | "offline";
}): Promise<CreateAppointmentResponse> => {
  try {
    // First, find the schedule ID for the selected date and time
    const schedules = await getDoctorSchedules(data.doctorId);
    const selectedSchedule = schedules.find(
      (schedule) =>
        schedule.date === data.selectedDate &&
        schedule.startTime === data.selectedTime &&
        !schedule.isBooked
    );

    if (!selectedSchedule) {
      throw new Error("Khung giờ đã chọn không còn trống");
    }

    // Create appointment with found schedule
    const appointmentData: CreateAppointmentData = {
      patientId: data.patientId,
      doctorId: data.doctorId,
      scheduleId: selectedSchedule._id,
      appointmentTime: data.selectedTime,
      symptoms: data.symptoms || "",
      mode: data.mode || "offline",
    };

    return await createAppointment(appointmentData);
  } catch (error) {
    console.error("Error in quick booking:", error);
    throw error;
  }
};

// Get available time slots for a specific doctor and date
export const getAvailableTimeSlots = async (
  doctorId: string,
  date: string
): Promise<
  Array<{
    time: string;
    scheduleId: string;
    status: "available" | "booked";
  }>
> => {
  try {
    const schedules = await getDoctorSchedules(doctorId);
    const daySchedules = schedules.filter(
      (schedule) =>
        schedule.date === date &&
        schedule.status === "accepted" &&
        !schedule.isBooked
    );

    // Tạo các slot 30 phút từ mỗi schedule
    const timeSlots: Array<{
      time: string;
      scheduleId: string;
      status: "available" | "booked";
    }> = [];

    daySchedules.forEach((schedule) => {
      // Parse start and end time
      const [startHour, startMinute] = schedule.startTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      // Get current time for validation (if today)
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

      // Generate 30-minute slots
      for (
        let minutes = startTimeInMinutes;
        minutes < endTimeInMinutes;
        minutes += 30
      ) {
        // Skip past time slots for today
        if (date === today && minutes < currentTimeInMinutes) {
          continue;
        }

        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const timeSlot = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;

        timeSlots.push({
          time: timeSlot,
          scheduleId: schedule._id,
          status: "available",
        });
      }
    });

    // Sort by time
    timeSlots.sort((a, b) => a.time.localeCompare(b.time));

    return timeSlots;
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return [];
  }
};
