import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const getDoctors = (specialty?: string) =>
  axios
    .get(`${BASE_URL}/doctor/doctors`, {
      params: {
        specialty: specialty ? decodeURIComponent(specialty) : undefined,
      },
    })
    .then((r) => r.data)
    .catch((error) => {
      console.error("Error fetching doctors:", error);
      throw error;
    });
