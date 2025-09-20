import { useEffect, useMemo, useState, useCallback } from "react";
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
  RefreshCw,
  Phone,
  Mail,
  Info,
  Send,
} from "lucide-react";
import ChatModal from "../../../components/Chat/ChatModal";
import { sendMessage } from "../../../api/chatApi";

// ===== Types =====
export type StatusKey =
  | "pending"
  | "confirmed"
  | "examining"
  | "prescribing"
  | "done"
  | "cancelled";

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
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
  status: StatusKey;
  symptoms?: string;
  note?: string; // có thể chứa [Dịch vụ] ...
  createdAt: string;
};

// ===== UI helpers =====
const STATUS_META: Record<
  StatusKey,
  { label: string; chip: string; dot: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Đã xác nhận",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  examining: {
    label: "Đang khám",
    chip: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  prescribing: {
    label: "Kê đơn",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  done: {
    label: "Hoàn thành",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Đã hủy",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

function getStatusIcon(status: StatusKey) {
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
  }
}

function getNextStatusOptions(current: StatusKey) {
  switch (current) {
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
      ] as const;
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
      ] as const;
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
      ] as const;
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
      ] as const;
    default:
      return [] as const;
  }
}

function parseService(note?: string) {
  if (!note) return "";
  const m = note.match(/\[Dịch vụ\]\s*([^|]+)/);
  return m?.[1]?.trim() || "";
}

// ===== Main =====
const DoctorAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"" | StatusKey>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Detail modal
  const [selected, setSelected] = useState<Appointment | null>(null);

  // Chat modal
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatAppointment, setChatAppointment] = useState<Appointment | null>(
    null
  );

  const loadAppointments = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/doctor/appointments?doctorId=${user._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.ok) {
        const data = (await response.json()) as Appointment[];
        setAppointments(data);
        setError("");
      } else {
        setError("Không tải được lịch hẹn");
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadAppointments();
  }, [user?._id, loadAppointments]);

  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: StatusKey
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
          body: JSON.stringify({ status: newStatus, doctorId: user?._id }),
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

  const handleOpenChat = (appointment: Appointment) => {
    setChatAppointment(appointment);
    setChatModalOpen(true);
  };

  const handleSendMessage = async (message: string, appointmentId: string) => {
    try {
      const appointment = appointments.find((a) => a._id === appointmentId);
      if (!appointment || !user?._id) return;
      await sendMessage({
        appointmentId,
        doctorId: user._id,
        patientId: appointment.patientId._id,
        senderRole: "doctor",
        content: message,
      });
      alert("Gửi tin nhắn thành công");
    } catch (e: any) {
      alert(e?.message || "Gửi tin nhắn thất bại");
    }
  };

  // Derived filters & groups
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesDate =
        !selectedDate || apt.scheduleId?.date === selectedDate;
      const matchesStatus = !statusFilter || apt.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        apt.patientId.name.toLowerCase().includes(term) ||
        apt.patientId.phone.includes(term) ||
        apt.patientId.email?.toLowerCase().includes(term) ||
        apt.symptoms?.toLowerCase().includes(term) ||
        apt.note?.toLowerCase().includes(term);
      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [appointments, selectedDate, statusFilter, searchTerm]);

  const groupedByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filteredAppointments.forEach((apt) => {
      const date = apt.scheduleId?.date || "unknown";
      (map[date] ||= []).push(apt);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) =>
        (a.scheduleId?.startTime || "").localeCompare(
          b.scheduleId?.startTime || ""
        )
      )
    );
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredAppointments]);

  const availableDates = useMemo(
    () =>
      [...new Set(appointments.map((apt) => apt.scheduleId?.date))]
        .filter(Boolean)
        .sort(),
    [appointments]
  );
  const availableStatuses = useMemo(
    () => Array.from(new Set(appointments.map((apt) => apt.status))),
    [appointments]
  );

  // ===== UI =====
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 text-white">
        <div className="mx-auto max-w-7xl px-6 py-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Quản lý lịch hẹn</h1>
            <p className="text-white/90">
              Xem nhanh theo ngày, thao tác trạng thái một chạm, mở chi tiết
              bệnh nhân.
            </p>
          </div>
          <button
            onClick={loadAppointments}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium text-white ring-1 ring-white/30 hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4" /> Tải lại
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        {/* Filters Card */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Bộ lọc</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                <Search className="mr-1 inline h-4 w-4" />
                Tìm kiếm (tên/sđt/email/triệu chứng)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="VD: Nguyễn A, 0909..., đau đầu"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                <Calendar className="mr-1 inline h-4 w-4" />
                Lọc theo ngày
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
              >
                <option value="">Tất cả ngày</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d + "T00:00:00").toLocaleDateString("vi-VN")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Lọc theo trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusKey | "")
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
              >
                <option value="">Tất cả trạng thái</option>
                {availableStatuses.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_META[st as StatusKey]?.label || st}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(selectedDate || statusFilter || searchTerm) && (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-600">Đang lọc:</span>
              {searchTerm && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                  "{searchTerm}"
                </span>
              )}
              {selectedDate && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "vi-VN"
                  )}
                </span>
              )}
              {statusFilter && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">
                  {STATUS_META[statusFilter as StatusKey]?.label}
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedDate("");
                  setStatusFilter("");
                  setSearchTerm("");
                }}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
              >
                Xóa lọc
              </button>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-slate-600">
              Hiển thị{" "}
              <span className="font-semibold text-slate-900">
                {filteredAppointments.length}
              </span>{" "}
              /
              <span className="font-semibold text-slate-900">
                {" "}
                {appointments.length}
              </span>{" "}
              lịch hẹn
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-3 text-rose-700">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <span className="font-medium text-slate-700">Đang tải...</span>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && Object.keys(groupedByDate).length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              Không có lịch hẹn
            </h3>
            <p className="text-slate-600">
              {selectedDate || statusFilter || searchTerm
                ? "Không có lịch hẹn phù hợp với bộ lọc hiện tại"
                : "Bạn chưa có lịch hẹn nào"}
            </p>
          </div>
        )}

        {/* List by date */}
        <div className="space-y-6">
          {groupedByDate.map(([date, dateAppointments]) => (
            <div
              key={date}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Date header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    {new Date(date + "T00:00:00").toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {dateAppointments.length} lịch hẹn
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-100">
                {dateAppointments
                  .slice()
                  .sort((a, b) =>
                    (a.scheduleId?.startTime || "").localeCompare(
                      b.scheduleId?.startTime || ""
                    )
                  )
                  .map((appointment) => {
                    const meta = STATUS_META[appointment.status];
                    const service = parseService(appointment.note);
                    return (
                      <div
                        key={appointment._id}
                        className="px-6 py-6 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-6">
                          {/* Left cluster */}
                          <div className="flex flex-1 items-center gap-4">
                            {/* Time */}
                            {appointment.scheduleId?.startTime &&
                            appointment.scheduleId?.endTime ? (
                              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2">
                                <Clock className="h-4 w-4 text-emerald-600" />
                                <span className="font-mono font-medium text-emerald-700">
                                  {appointment.scheduleId.startTime} -{" "}
                                  {appointment.scheduleId.endTime}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                                <Clock className="h-4 w-4 text-slate-600" />
                                <span className="text-slate-700">
                                  Chưa có khung giờ
                                </span>
                              </div>
                            )}

                            {/* Patient */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelected(appointment)}
                                className="group flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-left hover:bg-blue-100"
                                title="Xem chi tiết bệnh nhân"
                              >
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-blue-700 group-hover:underline">
                                  {appointment.patientId.name}
                                </span>
                              </button>

                              {/* Chat Button */}
                              <button
                                onClick={() => handleOpenChat(appointment)}
                                className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                                title="Gửi tin nhắn cho bệnh nhân"
                              >
                                <Send className="h-4 w-4" />
                                Chat
                              </button>
                            </div>

                            {/* Status */}
                            <div
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${meta.chip}`}
                            >
                              {getStatusIcon(appointment.status)}
                              <span className="font-medium">{meta.label}</span>
                            </div>
                          </div>

                          {/* Right actions */}
                          <div className="flex flex-col items-end gap-4">
                            {/* Status actions */}
                            <div className="flex items-center gap-2">
                              {getNextStatusOptions(appointment.status).map(
                                (opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => {
                                      if (opt.value === "cancelled") {
                                        if (
                                          !confirm(
                                            "Bạn chắc muốn hủy lịch này?"
                                          )
                                        )
                                          return;
                                      }
                                      updateAppointmentStatus(
                                        appointment._id,
                                        opt.value
                                      );
                                    }}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${opt.color}`}
                                  >
                                    {opt.value === "examining" && (
                                      <Stethoscope className="h-4 w-4" />
                                    )}
                                    {opt.value === "prescribing" && (
                                      <Pill className="h-4 w-4" />
                                    )}
                                    {opt.value === "done" && (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    {opt.value === "cancelled" && (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                    {opt.value === "confirmed" && (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    {opt.label}
                                  </button>
                                )
                              )}
                            </div>

                            {/* Notes */}
                            <div className="flex max-w-md flex-col gap-3">
                              {service && (
                                <div className="flex items-center gap-2 text-sm text-emerald-700">
                                  <Info className="h-4 w-4 text-emerald-600" />
                                  <span className="font-medium">{service}</span>
                                </div>
                              )}
                              {appointment.symptoms && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                  <div className="flex items-start gap-3">
                                    <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                        Triệu chứng
                                      </p>
                                      <p className="text-sm leading-relaxed text-amber-700">
                                        {appointment.symptoms}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {appointment.note && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                  <div className="flex items-start gap-3">
                                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-600" />
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                                        Ghi chú
                                      </p>
                                      <p className="text-sm leading-relaxed text-slate-600">
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
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Chi tiết bệnh nhân
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 text-xs font-medium text-slate-500">
                  Thông tin
                </div>
                <div className="text-slate-900">{selected.patientId.name}</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="h-4 w-4" />
                  {selected.patientId.phone || "—"}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-4 w-4" />
                  {selected.patientId.email || "—"}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 text-xs font-medium text-slate-500">
                  Lịch khám
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <Calendar className="h-4 w-4" />{" "}
                  {new Date(
                    selected.scheduleId.date + "T00:00:00"
                  ).toLocaleDateString("vi-VN")}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-800">
                  <Clock className="h-4 w-4" /> {selected.scheduleId.startTime}{" "}
                  - {selected.scheduleId.endTime}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Mã lịch: {selected._id}
                </div>
              </div>
              {selected.symptoms && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 md:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Triệu chứng
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-amber-800">
                    {selected.symptoms}
                  </div>
                </div>
              )}
              {selected.note && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Ghi chú
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-slate-800">
                    {selected.note}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => {
                  handleOpenChat(selected);
                  setSelected(null);
                }}
                className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <Send className="h-4 w-4" />
                Gửi tin nhắn
              </button>

              <div className="flex items-center gap-2">
                {getNextStatusOptions(selected.status).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (
                        opt.value === "cancelled" &&
                        !confirm("Bạn chắc muốn hủy lịch này?")
                      )
                        return;
                      updateAppointmentStatus(selected._id, opt.value);
                      setSelected(null);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${opt.color}`}
                  >
                    {opt.value === "examining" && (
                      <Stethoscope className="h-4 w-4" />
                    )}
                    {opt.value === "prescribing" && (
                      <Pill className="h-4 w-4" />
                    )}
                    {opt.value === "done" && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {opt.value === "cancelled" && (
                      <XCircle className="h-4 w-4" />
                    )}
                    {opt.value === "confirmed" && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false);
          setChatAppointment(null);
        }}
        appointment={chatAppointment}
        doctorName={user?.name || "Bác sĩ"}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default DoctorAppointmentsPage;
