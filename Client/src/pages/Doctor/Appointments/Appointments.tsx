import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  Stethoscope,
  Pill,
  FileText,
} from "lucide-react";

type Appointment = {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  scheduleId: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  status:
    | "pending"
    | "confirmed"
    | "examining"
    | "prescribing"
    | "done"
    | "cancelled";
  symptoms?: string;
  note?: string;
  createdAt: string;
};

const DoctorAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const loadAppointments = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/doctor/appointments?doctorId=${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        setError("Không tải được lịch hẹn");
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user?._id]);

  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/doctor/appointments/${appointmentId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            status: newStatus,
            doctorId: user?._id,
          }),
        }
      );

      if (response.ok) {
        await loadAppointments(); // Reload data
        setError(""); // Clear any previous errors
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Không thể cập nhật trạng thái");
      }
    } catch {
      setError("Lỗi kết nối");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "examining":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "prescribing":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "done":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "examining":
        return <Stethoscope className="h-4 w-4" />;
      case "prescribing":
        return <Pill className="h-4 w-4" />;
      case "done":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "examining":
        return "Đang khám";
      case "prescribing":
        return "Kê đơn thuốc";
      case "done":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return [
          {
            value: "confirmed",
            label: "Xác nhận",
            color:
              "bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600",
          },
          {
            value: "cancelled",
            label: "Hủy",
            color:
              "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
          },
        ];
      case "confirmed":
        return [
          {
            value: "examining",
            label: "Bắt đầu khám",
            color:
              "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
          },
          {
            value: "cancelled",
            label: "Hủy",
            color:
              "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
          },
        ];
      case "examining":
        return [
          {
            value: "prescribing",
            label: "Kê đơn",
            color:
              "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
          },
          {
            value: "cancelled",
            label: "Hủy",
            color:
              "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
          },
        ];
      case "prescribing":
        return [
          {
            value: "done",
            label: "Hoàn thành",
            color:
              "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
          },
          {
            value: "cancelled",
            label: "Hủy",
            color:
              "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
          },
        ];
      default:
        return [];
    }
  };

  const filteredAppointments = appointments.filter(
    (apt) => !selectedDate || apt.scheduleId?.date === selectedDate
  );

  const groupedByDate = filteredAppointments.reduce((acc, apt) => {
    const date = apt.scheduleId?.date || "unknown";
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                Quản lý lịch hẹn
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Xem và quản lý tất cả lịch hẹn của bệnh nhân
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Calendar className="h-4 w-4 inline mr-2" />
              Lọc theo ngày
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm text-gray-700 font-medium"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <span className="text-red-800 font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <span className="text-gray-700 font-semibold text-lg">
                Đang tải...
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {Object.keys(groupedByDate).length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Calendar className="h-16 w-16 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Không có lịch hẹn
            </h3>
            <p className="text-gray-600 text-lg">
              {selectedDate
                ? `Không có lịch hẹn nào vào ngày ${selectedDate}`
                : "Bạn chưa có lịch hẹn nào"}
            </p>
          </div>
        )}

        {/* Appointments by Date */}
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([date, dateAppointments]) => (
            <div key={date} className="group">
              <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 overflow-hidden hover:shadow-2xl transition-all duration-500 ">
                {/* Date Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-teal-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {new Date(date + "T00:00:00").toLocaleDateString(
                            "vi-VN",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </h2>
                        <p className="text-white/80 font-mono text-sm">
                          {date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      <span className="text-white font-bold">
                        {dateAppointments.length} lịch hẹn
                      </span>
                    </div>
                  </div>
                </div>

                {/* Appointments */}
                <div className="divide-y divide-gray-100/50">
                  {dateAppointments
                    .sort((a, b) =>
                      a.scheduleId.startTime.localeCompare(
                        b.scheduleId.startTime
                      )
                    )
                    .map((appointment) => (
                      <div
                        key={appointment._id}
                        className="px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-teal-50/50 transition-all duration-300 group/item"
                      >
                        <div className="flex items-start justify-between gap-6">
                          {/* Left: Appointment Info */}
                          <div className="flex items-center gap-6 flex-1">
                            {/* Time */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 shadow-sm">
                              <Clock className="h-5 w-5 text-emerald-600" />
                              <span className="font-mono font-bold text-emerald-700 text-lg">
                                {appointment.scheduleId.startTime} -{" "}
                                {appointment.scheduleId.endTime}
                              </span>
                            </div>

                            {/* Patient Info */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-200 shadow-sm">
                              <User className="h-5 w-5 text-blue-600" />
                              <span className="text-lg font-semibold text-blue-700">
                                {appointment.patientId.name}
                              </span>
                            </div>

                            {/* Status */}
                            <div
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-sm ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {getStatusIcon(appointment.status)}
                              <span className="text-lg font-semibold">
                                {getStatusText(appointment.status)}
                              </span>
                            </div>
                          </div>

                          {/* Right: Actions & Notes */}
                          <div className="flex flex-col gap-4 items-end">
                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                              {getNextStatusOptions(appointment.status).map(
                                (option) => (
                                  <button
                                    key={option.value}
                                    onClick={() =>
                                      updateAppointmentStatus(
                                        appointment._id,
                                        option.value
                                      )
                                    }
                                    className={`px-5 py-3 text-white rounded-xl transition-all duration-300 text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transform ${option.color}`}
                                  >
                                    {option.value === "examining" && (
                                      <Stethoscope className="h-4 w-4" />
                                    )}
                                    {option.value === "prescribing" && (
                                      <Pill className="h-4 w-4" />
                                    )}
                                    {option.value === "done" && (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    {option.value === "cancelled" && (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                    {option.value === "confirmed" && (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    {option.label}
                                  </button>
                                )
                              )}
                            </div>

                            {/* Symptoms & Notes */}
                            <div className="flex flex-col gap-3 max-w-sm">
                              {appointment.symptoms && (
                                <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 shadow-sm">
                                  <div className="flex items-start gap-3">
                                    <MessageSquare className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-bold text-orange-700 mb-2 uppercase tracking-wide">
                                        Triệu chứng
                                      </p>
                                      <p className="text-sm text-orange-600 leading-relaxed">
                                        {appointment.symptoms}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {appointment.note && (
                                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-200 shadow-sm">
                                  <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">
                                        Ghi chú
                                      </p>
                                      <p className="text-sm text-blue-600 leading-relaxed">
                                        {appointment.note}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentsPage;
