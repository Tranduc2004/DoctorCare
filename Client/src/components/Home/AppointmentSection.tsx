import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createAppointment,
  getDoctorSchedules,
} from "../../api/appointmentApi";
import { toast } from "react-toastify";
import { getDoctors } from "../../api/doctorsApi";
import { specialtyApi } from "../../api/specialtyApi";

type Schedule = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
};

type TimeSlot = {
  scheduleId: string;
  date: string;
  time: string;
  displayTime: string;
};

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export default function AppointmentSection() {
  const { user, isAuthenticated } = useAuth();
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState("");
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<
    Array<{
      _id: string;
      name: string;
      specialty?: string;
      workplace?: string;
      experience?: number;
      description?: string;
      consultationFee?: number;
    }>
  >([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [symptoms, setSymptoms] = useState("");
  const [note, setNote] = useState("");

  // Function to generate individual time slots from schedule
  const generateTimeSlots = (schedule: Schedule): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = parseInt(schedule.startTime.split(":")[0]);
    const startMinute = parseInt(schedule.startTime.split(":")[1]);
    const endHour = parseInt(schedule.endTime.split(":")[0]);
    const endMinute = parseInt(schedule.endTime.split(":")[1]);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Create 30-minute time slots
    for (
      let minutes = startTotalMinutes;
      minutes < endTotalMinutes;
      minutes += 30
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const nextHour = Math.floor((minutes + 30) / 60);
      const nextMinute = (minutes + 30) % 60;

      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const nextTimeString = `${nextHour
        .toString()
        .padStart(2, "0")}:${nextMinute.toString().padStart(2, "0")}`;
      const displayTime = `${timeString} - ${nextTimeString}`;

      slots.push({
        scheduleId: schedule._id,
        date: schedule.date,
        time: timeString,
        displayTime: displayTime,
      });
    }

    return slots;
  };

  // Get specialty name by ID
  const getSpecialtyName = (specialtyId: string) => {
    if (!specialtyId) return "";
    const specialty = specialties.find((s) => s._id === specialtyId);
    return specialty ? specialty.name : "Không xác định";
  };

  // Fetch specialties from API
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const data = await specialtyApi.getActiveSpecialties();
        setSpecialties(data || []);
      } catch (e: any) {
        console.error("Error loading specialties:", e);
        toast.error("Không thể tải danh sách chuyên khoa");
      }
    };
    loadSpecialties();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        // Sử dụng selectedSpecialtyId để tìm kiếm bác sĩ theo chuyên khoa
        const data = await getDoctors(selectedSpecialtyId || undefined);
        setDoctors(data || []);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Không tải được bác sĩ");
      }
    };
    if (selectedSpecialtyId) {
      loadDoctors();
    } else {
      setDoctors([]);
    }
  }, [selectedSpecialtyId]);

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

  const availableTimeSlots = useMemo(() => {
    let allSlots: TimeSlot[] = [];

    // Generate time slots for all schedules
    schedules.forEach((schedule) => {
      const slots = generateTimeSlots(schedule);
      allSlots = [...allSlots, ...slots];
    });

    // Filter by selected date if specified
    if (date) {
      allSlots = allSlots.filter((slot) => slot.date === date);
    }

    // Sort by date and time
    allSlots.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.time.localeCompare(b.time);
    });

    return allSlots;
  }, [date, schedules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.info("Vui lòng đăng nhập để đặt lịch");
      return;
    }
    if (!doctorId || !selectedTimeSlot) {
      toast.warning("Hãy chọn bác sĩ và khung giờ");
      return;
    }
    try {
      setLoading(true);
      await createAppointment({
        patientId: user._id,
        doctorId,
        scheduleId: selectedTimeSlot.scheduleId,
        symptoms,
        note,
        appointmentTime: selectedTimeSlot.time, // Add specific time
      });
      toast.success("Đặt lịch thành công! Đang chờ xác nhận");
      setSelectedTimeSlot(null);
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
                    value={selectedSpecialtyId}
                    onChange={(e) => {
                      const specialtyId = e.target.value;
                      setSelectedSpecialtyId(specialtyId);
                      setDoctorId("");
                      setSchedules([]);
                      setSelectedTimeSlot(null);
                    }}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Chọn chuyên khoa --</option>
                    {specialties
                      .filter((sp) => sp.isActive)
                      .map((sp) => (
                        <option key={sp._id} value={sp._id}>
                          {sp.name}
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
                    disabled={!selectedSpecialtyId}
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map((d) => {
                      const specialtyName = getSpecialtyName(d.specialty || "");
                      const doctorInfo = [
                        d.name,
                        specialtyName,
                        d.workplace,
                        d.experience ? `${d.experience} năm kinh nghiệm` : "",
                      ]
                        .filter(Boolean)
                        .join(" - ");

                      return (
                        <option key={d._id} value={d._id}>
                          {doctorInfo}
                        </option>
                      );
                    })}
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
                  Chọn khung giờ trống (mỗi slot 30 phút)
                </label>
                <div className="min-h-[100px] max-h-[200px] overflow-y-auto border border-gray-200 rounded-md p-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-600">
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Đang tải lịch...
                    </div>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-8">
                      {!doctorId
                        ? "Vui lòng chọn bác sĩ để xem lịch trống"
                        : "Không có khung giờ phù hợp."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableTimeSlots.map((slot, index) => {
                        const isSelected =
                          selectedTimeSlot?.scheduleId === slot.scheduleId &&
                          selectedTimeSlot?.time === slot.time;
                        const displayLabel = date
                          ? slot.displayTime
                          : `${slot.date} - ${slot.displayTime}`;

                        return (
                          <button
                            type="button"
                            key={`${slot.scheduleId}-${slot.time}-${index}`}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`px-3 py-2 rounded-md border text-sm transition text-left ${
                              isSelected
                                ? "bg-teal-500 text-white border-teal-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {displayLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedTimeSlot && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Đã chọn:</strong> {selectedTimeSlot.date} -{" "}
                    {selectedTimeSlot.displayTime}
                  </div>
                )}
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
