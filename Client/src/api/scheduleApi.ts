import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const getMySchedules = async (doctorId: string) => {
  const res = await axios.get(`${BASE_URL}/doctor/schedule/my`, {
    params: { doctorId },
  });
  return res.data;
};
