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
  Filter,
  Search,
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
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

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
        await loadAppointments();
        setError("");
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
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "examining":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "prescribing":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "done":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
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
            color: "bg-blue-600 hover:bg-blue-700 text-white",
          },
          {
            value: "cancelled",
            label: "Hủy",
            color: "bg-rose-600 hover:bg-rose-700 text-white",
          },
        ];
      case "confirmed":
        return [
          {
            value: "examining",
            label: "Bắt đầu khám",
            color: "bg-purple-600 hover:bg-purple-700 text-white",
          },
          {
            value: "cancelled",
            label: "Hủy",
            color: "bg-rose-600 hover:bg-rose-700 text-white",
          },
        ];
      case "examining":
        return [
          {
            value: "prescribing",
            label: "Kê đơn",
            color: "bg-indigo-600 hover:bg-indigo-700 text-white",
          },
          {
            value: "cancelled",
            label: "Hủy",
            color: "bg-rose-600 hover:bg-rose-700 text-white",
          },
        ];
      case "prescribing":
        return [
          {
            value: "done",
            label: "Hoàn thành",
            color: "bg-emerald-600 hover:bg-emerald-700 text-white",
          },
          {
            value: "cancelled",
            label: "Hủy",
            color: "bg-rose-600 hover:bg-rose-700 text-white",
          },
        ];
      default:
        return [];
    }
  };

  // Filter appointments based on all filters
  const filteredAppointments = appointments.filter((apt) => {
    const matchesDate = !selectedDate || apt.scheduleId?.date === selectedDate;
    const matchesStatus = !statusFilter || apt.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      apt.patientId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientId.phone.includes(searchTerm);

    return matchesDate && matchesStatus && matchesSearch;
  });

  const groupedByDate = filteredAppointments.reduce((acc, apt) => {
    const date = apt.scheduleId?.date || "unknown";
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Get unique dates and statuses for filter options
  const availableDates = [
    ...new Set(appointments.map((apt) => apt.scheduleId?.date)),
  ].sort();
  const availableStatuses = [...new Set(appointments.map((apt) => apt.status))];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Quản lý lịch hẹn
                </h1>
                <p className="text-slate-600">
                  Tổng cộng {appointments.length} lịch hẹn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Bộ lọc</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Search className="h-4 w-4 inline mr-1" />
                  Tìm kiếm bệnh nhân
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tên hoặc số điện thoại..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Lọc theo ngày
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả ngày</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date + "T00:00:00").toLocaleDateString("vi-VN")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lọc theo trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả trạng thái</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusText(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedDate || statusFilter || searchTerm) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                <span className="text-sm text-slate-600">Đang lọc:</span>
                {searchTerm && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    "{searchTerm}"
                  </span>
                )}
                {selectedDate && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                )}
                {statusFilter && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {getStatusText(statusFilter)}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedDate("");
                    setStatusFilter("");
                    setSearchTerm("");
                  }}
                  className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-rose-600" />
              <span className="text-rose-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-slate-700 font-medium">Đang tải...</span>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {!loading && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-slate-600">
                Hiển thị{" "}
                <span className="font-semibold text-slate-900">
                  {filteredAppointments.length}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-semibold text-slate-900">
                  {appointments.length}
                </span>{" "}
                lịch hẹn
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {Object.keys(groupedByDate).length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Không có lịch hẹn nào
            </h3>
            <p className="text-slate-600">
              {selectedDate || statusFilter || searchTerm
                ? "Không có lịch hẹn nào phù hợp với bộ lọc hiện tại"
                : "Bạn chưa có lịch hẹn nào"}
            </p>
          </div>
        )}

        {/* Appointments by Date */}
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dateAppointments]) => (
            <div key={date}>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Date Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-slate-600" />
                      <h2 className="text-lg font-semibold text-slate-900">
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
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {dateAppointments.length} lịch hẹn
                      </span>
                    </div>
                  </div>
                </div>

                {/* Appointments */}
                <div className="divide-y divide-slate-100">
                  {dateAppointments
                    .sort((a, b) => {
                      const aTime = a.scheduleId?.startTime || "";
                      const bTime = b.scheduleId?.startTime || "";
                      return aTime.localeCompare(bTime);
                    })
                    .map((appointment) => (
                      <div
                        key={appointment._id}
                        className="px-6 py-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-6">
                          {/* Left: Appointment Info */}
                          <div className="flex items-center gap-4 flex-1">
                            {/* Time */}
                            {appointment.scheduleId?.startTime &&
                            appointment.scheduleId?.endTime ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                                <Clock className="h-4 w-4 text-emerald-600" />
                                <span className="font-mono font-medium text-emerald-700">
                                  {appointment.scheduleId.startTime} -{" "}
                                  {appointment.scheduleId.endTime}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                <Clock className="h-4 w-4 text-slate-600" />
                                <span className="text-slate-700">
                                  Chưa có khung giờ
                                </span>
                              </div>
                            )}

                            {/* Patient Info */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-blue-700">
                                {appointment.patientId.name}
                              </span>
                            </div>

                            {/* Status */}
                            <div
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {getStatusIcon(appointment.status)}
                              <span className="font-medium">
                                {getStatusText(appointment.status)}
                              </span>
                            </div>
                          </div>

                          {/* Right: Actions & Notes */}
                          <div className="flex flex-col gap-4 items-end">
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
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
                                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-sm ${option.color}`}
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
                            <div className="flex flex-col gap-3 max-w-md">
                              {appointment.symptoms && (
                                <div className="px-4 py-3 bg-amber-50 rounded-lg border border-amber-200">
                                  <div className="flex items-start gap-3">
                                    <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">
                                        Triệu chứng
                                      </p>
                                      <p className="text-sm text-amber-600 leading-relaxed">
                                        {appointment.symptoms}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {appointment.note && (
                                <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                                  <div className="flex items-start gap-3">
                                    <FileText className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                                        Ghi chú
                                      </p>
                                      <p className="text-sm text-slate-600 leading-relaxed">
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
