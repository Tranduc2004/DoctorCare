import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createAppointment,
  getDoctorSchedules,
} from "../../api/appointmentApi";
import { toast } from "react-toastify";
import { getDoctors } from "../../api/doctorsApi";
import SPECIALTIES from "../../constants/specialties";

type Schedule = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
};

export default function AppointmentSection() {
  const { user, isAuthenticated } = useAuth();
  const [specialty, setSpecialty] = useState("");
  const [doctors, setDoctors] = useState<
    Array<{ _id: string; name: string; specialty?: string }>
  >([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await getDoctors(specialty || undefined);
        setDoctors(data || []);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Không tải được bác sĩ");
      }
    };
    if (specialty) {
      loadDoctors();
    } else {
      setDoctors([]);
    }
  }, [specialty]);

  useEffect(() => {
    const load = async () => {
      if (!doctorId) {
        setSchedules([]);
        return;
      }
      try {
        setLoading(true);
        const data = await getDoctorSchedules(doctorId);
        // Chỉ hiển thị ca làm việc đã được chấp nhận và chưa được đặt
        const availableSchedules = (data || []).filter(
          (schedule: any) =>
            schedule.status === "accepted" && !schedule.isBooked
        );
        setSchedules(availableSchedules);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Không tải được lịch bác sĩ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId]);

  const filteredSchedules = useMemo(() => {
    if (!date) return schedules;
    return schedules.filter((s) => s.date === date);
  }, [date, schedules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.info("Vui lòng đăng nhập để đặt lịch");
      return;
    }
    if (!doctorId || !selectedScheduleId) {
      toast.warning("Hãy chọn bác sĩ và khung giờ");
      return;
    }
    try {
      setLoading(true);
      await createAppointment({
        patientId: user._id,
        doctorId,
        scheduleId: selectedScheduleId,
        symptoms,
        note,
      });
      toast.success("Đặt lịch thành công! Đang chờ xác nhận");
      setSelectedScheduleId("");
      setSymptoms("");
      setNote("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Đặt lịch thất bại");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section
      className="py-16 bg-gradient-to-r from-blue-500 to-teal-400 text-white"
      id="appointment"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Đặt lịch khám ngay hôm nay
            </h2>
            <p className="mb-6">
              Đặt lịch khám trực tuyến nhanh chóng và tiện lợi. Chỉ cần vài bước
              đơn giản, bạn có thể lựa chọn bác sĩ và thời gian phù hợp nhất.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <CheckCircle size={20} className="mr-2" />
                <span>Chọn chuyên khoa và bác sĩ phù hợp</span>
              </li>
              <li className="flex items-center">
                <CheckCircle size={20} className="mr-2" />
                <span>Lựa chọn ngày và giờ theo lịch trình của bạn</span>
              </li>
              <li className="flex items-center">
                <CheckCircle size={20} className="mr-2" />
                <span>Nhận xác nhận ngay lập tức qua email</span>
              </li>
              <li className="flex items-center">
                <CheckCircle size={20} className="mr-2" />
                <span>Thông báo nhắc lịch hẹn trước 24 giờ</span>
              </li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Đặt lịch khám
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">
                    Chuyên khoa
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => {
                      setSpecialty(e.target.value);
                      setDoctorId("");
                      setSchedules([]);
                      setSelectedScheduleId("");
                    }}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Chọn chuyên khoa --</option>
                    {SPECIALTIES.map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Bác sĩ</label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={!specialty}
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} {d.specialty ? `- ${d.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Ngày khám</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 text-black py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">
                    Triệu chứng
                  </label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ví dụ: sốt, ho, đau đầu..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">
                  Chọn khung giờ trống
                </label>
                <div className="min-h-[56px]">
                  {loading ? (
                    <div className="flex items-center text-gray-600">
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Đang tải lịch...
                    </div>
                  ) : filteredSchedules.length === 0 ? (
                    <div className="text-gray-500 text-sm">
                      Không có khung giờ phù hợp.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredSchedules.map((s) => {
                        const label = `${s.date} | ${s.startTime} - ${s.endTime}`;
                        const active = selectedScheduleId === s._id;
                        return (
                          <button
                            type="button"
                            key={s._id}
                            onClick={() => setSelectedScheduleId(s._id)}
                            className={`px-3 py-2 rounded-md border text-sm transition ${
                              active
                                ? "bg-teal-500 text-white border-teal-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  placeholder="Ghi chú thêm (nếu có)"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-medium rounded-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Xác nhận đặt lịch"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
