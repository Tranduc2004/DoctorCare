import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  adminDeleteAppointment,
  adminGetAllAppointments,
  adminGetAppointmentStats,
  adminUpdateAppointmentStatus,
} from "../../api/adminApi";
import {
  Calendar,
  Filter,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

type Appointment = {
  _id: string;
  patientId: { _id: string; name: string; email?: string; phone?: string };
  doctorId: {
    _id: string;
    name: string;
    specialty?: string;
    workplace?: string;
  };
  scheduleId?: {
    _id: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } | null;
  mode?: "online" | "offline" | string;
  status:
    | "pending"
    | "confirmed"
    | "examining"
    | "prescribing"
    | "done"
    | "cancelled"
    | "payment_overdue"
    | "doctor_reschedule";
  symptoms?: string;
  note?: string;
  createdAt: string;
};

function deriveKind(a: Appointment): "SERVICE" | "SPECIALTY" {
  const note = a.note?.toLowerCase() || "";
  if (
    note.includes("[dịch vụ]") ||
    note.includes("khám tổng quát") ||
    note.includes("khám chuyên khoa") ||
    note.includes("gói") ||
    note.includes("tư vấn")
  ) {
    return "SERVICE";
  }
  return "SPECIALTY";
}

export default function AdminAppointmentsPage() {
  const { token } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  } | null>(null);

  // filters
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"" | "SERVICE" | "SPECIALTY">("");

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [listRes, statsRes] = await Promise.all([
        adminGetAllAppointments(token, { status, from: date, to: date }),
        adminGetAppointmentStats(token),
      ]);
      setAppointments(listRes.data || []);
      setStats(statsRes.data || null);
    } catch {
      setError("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status, date]);

  const filtered = useMemo(() => {
    let list = appointments;
    if (kind) list = list.filter((a) => deriveKind(a) === kind);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.patientId?.name?.toLowerCase().includes(q) ||
        a.doctorId?.name?.toLowerCase().includes(q) ||
        a.patientId?.phone?.includes(q) ||
        a.note?.toLowerCase().includes(q)
    );
  }, [appointments, search, kind]);

  const onUpdateStatus = async (
    id: string,
    newStatus:
      | "pending"
      | "doctor_reschedule"
      | "confirmed"
      | "examining"
      | "prescribing"
      | "done"
      | "cancelled"
  ) => {
    if (!token) return;
    try {
      await adminUpdateAppointmentStatus(token, id, newStatus);
      await loadData();
    } catch {
      setError("Không thể cập nhật trạng thái");
    }
  };

  const onDelete = async (id: string) => {
    if (!token) return;
    if (!confirm("Xóa lịch hẹn này?")) return;
    try {
      await adminDeleteAppointment(token, id);
      await loadData();
    } catch {
      setError("Không thể xóa lịch hẹn");
    }
  };

  const statusOptions: { value: Appointment["status"] | ""; label: string }[] =
    [
      { value: "", label: "Tất cả" },
      { value: "pending", label: "Chờ" },
      { value: "doctor_reschedule", label: "Đề xuất đổi lịch" },
      { value: "confirmed", label: "Đã xác nhận" },
      { value: "examining", label: "Đang khám" },
      { value: "payment_overdue", label: "Quá hạn thanh toán" },
      { value: "prescribing", label: "Đã kê đơn" },
      { value: "done", label: "Hoàn thành" },
      { value: "cancelled", label: "Đã hủy" },
    ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 opacity-90" />
                <h1 className="text-2xl font-bold">Quản lý lịch hẹn</h1>
              </div>
              <p className="mt-1 text-white/90">
                Tổng quan lịch hẹn – lọc nhanh – thao tác trạng thái.
              </p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium text-white ring-1 ring-white/30 hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" /> Tải lại
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat label="Tổng số" value={stats?.total ?? 0} tone="white" />
            <HeroStat label="Chờ" value={stats?.pending ?? 0} tone="amber" />
            <HeroStat
              label="Xác nhận"
              value={stats?.confirmed ?? 0}
              tone="sky"
            />
            <HeroStat
              label="Hoàn thành"
              value={stats?.completed ?? 0}
              tone="emerald"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        {/* Filters */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Bộ lọc</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div>
              <Label>Trạng thái</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Ngày</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <Label>Loại</Label>
              <select
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as "" | "SERVICE" | "SPECIALTY")
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Tất cả</option>
                <option value="SERVICE">Khám dịch vụ</option>
                <option value="SPECIALTY">Theo khoa/bác sĩ</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Tìm kiếm</Label>
              <div className="flex items-center rounded-lg border border-slate-300 px-3 py-2 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-600">
                <Search className="mr-2 h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bệnh nhân / Bác sĩ / SĐT / ghi chú"
                  className="flex-1 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Ngày</Th>
                  <Th>Giờ</Th>
                  <Th>Bệnh nhân</Th>
                  <Th>Bác sĩ</Th>
                  <Th>Loại</Th>
                  <Th>Hình thức</Th>
                  <Th>Trạng thái</Th>
                  <Th>Hành động</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-slate-600"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-rose-600">
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-slate-600"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const dateLabel = a.scheduleId?.date
                      ? new Date(
                          a.scheduleId.date + "T00:00:00"
                        ).toLocaleDateString("vi-VN")
                      : new Date(a.createdAt).toLocaleDateString("vi-VN");
                    const timeLabel =
                      a.scheduleId?.startTime && a.scheduleId?.endTime
                        ? `${a.scheduleId.startTime} - ${a.scheduleId.endTime}`
                        : "-";
                    const kindLabel =
                      deriveKind(a) === "SERVICE"
                        ? "Khám dịch vụ"
                        : "Theo khoa/bác sĩ";

                    return (
                      <tr key={a._id} className="hover:bg-slate-50">
                        <Td>{dateLabel}</Td>
                        <Td>{timeLabel}</Td>
                        <Td>
                          <div className="font-medium text-slate-900">
                            {a.patientId?.name}
                          </div>
                          <div className="text-sm text-slate-600">
                            {a.patientId?.phone}
                          </div>
                        </Td>
                        <Td>
                          <div className="font-medium text-slate-900">
                            {a.doctorId?.name}
                          </div>
                          <div className="text-sm text-slate-600">
                            {a.doctorId?.specialty}
                            {a.doctorId?.workplace
                              ? ` • ${a.doctorId.workplace}`
                              : ""}
                          </div>
                        </Td>
                        <Td>{kindLabel}</Td>
                        <Td>
                          <span
                            className={`rounded-full border px-2 py-1 text-xs ${
                              a.mode === "online"
                                ? "border-teal-200 bg-teal-50 text-teal-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {a.mode === "online" ? "Trực tuyến" : "Tại cơ sở"}
                          </span>
                        </Td>
                        <Td>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${statusColor(
                              a.status
                            )}`}
                          >
                            {statusText(a.status)}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex flex-wrap items-center gap-2">
                            {nextStatuses(a.status).map((s) => (
                              <button
                                key={s.value}
                                onClick={() =>
                                  onUpdateStatus(
                                    a._id,
                                    s.value as
                                      | "pending"
                                      | "doctor_reschedule"
                                      | "confirmed"
                                      | "examining"
                                      | "prescribing"
                                      | "done"
                                      | "cancelled"
                                  )
                                }
                                className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium ${s.color}`}
                              >
                                {s.icon}
                                <span className="ml-1">{s.label}</span>
                              </button>
                            ))}
                            <button
                              onClick={() => onDelete(a._id)}
                              className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="inline h-3.5 w-3.5" />
                              <span className="ml-1">Xóa</span>
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------ UI helpers ------ */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 align-top text-sm text-slate-800">{children}</td>
  );
}

function HeroStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "white" | "amber" | "sky" | "emerald";
}) {
  const map: Record<string, string> = {
    white: "bg-white/10 text-white ring-1 ring-white/20",
    amber: "bg-amber-400/20 text-white ring-1 ring-white/20",
    sky: "bg-sky-400/20 text-white ring-1 ring-white/20",
    emerald: "bg-emerald-400/20 text-white ring-1 ring-white/20",
  };
  return (
    <div className={`rounded-xl p-4 ${map[tone]}`}>
      <div className="text-sm">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "booked":
    case "pending_payment":
    case "await_payment":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "doctor_approved":
    case "confirmed":
      return "border border-blue-200 bg-blue-50 text-blue-700";
    case "paid":
    case "done":
    case "completed":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "in_consult":
    case "examining":
      return "border border-purple-200 bg-purple-50 text-purple-700";
    case "prescription_issued":
    case "prescribing":
      return "border border-indigo-200 bg-indigo-50 text-indigo-700";
    case "doctor_reschedule":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "payment_failed":
      return "border border-red-200 bg-red-50 text-red-700";
    case "payment_overdue":
      return "border border-red-200 bg-red-50 text-red-700";
    case "cancelled":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
}

function statusText(status: string) {
  switch (status) {
    case "payment_overdue":
      return "Quá hạn thanh toán";
    case "booked":
      return "Mới đặt lịch";
    case "doctor_approved":
      return "Bác sĩ đã duyệt";
    case "pending_payment":
    case "await_payment":
      return "Chờ thanh toán";
    case "paid":
      return "Đã thanh toán";
    case "confirmed":
      return "Đã xác nhận";
    case "in_consult":
    case "examining":
      return "Đang khám";
    case "prescription_issued":
    case "prescribing":
      return "Đã kê đơn";
    case "completed":
    case "done":
      return "Hoàn thành";
    case "payment_failed":
      return "Thanh toán thất bại";
    case "cancelled":
      return "Đã hủy";
    case "doctor_reschedule":
      return "Đề xuất đổi lịch";
    case "pending":
      return "Chờ";
    default:
      return "Không xác định";
  }
}

function nextStatuses(current: string) {
  const makeBtn = (
    value: string,
    label: string,
    color: string,
    icon?: JSX.Element
  ) => ({ value, label, color, icon });

  const norm = (() => {
    if (!current) return "pending";
    const s = current as string;
    if (s === "doctor_reschedule") return "doctor_reschedule";
    if (
      s === "booked" ||
      s === "doctor_approved" ||
      s === "pending_payment" ||
      s === "await_payment"
    )
      return "pending";
    if (s === "paid") return "confirmed";
    if (s === "confirmed") return "confirmed";
    if (s === "in_consult" || s === "examining") return "examining";
    if (s === "prescription_issued" || s === "prescribing")
      return "prescribing";
    if (s === "completed" || s === "done") return "done";
    if (s === "payment_failed") return "pending";
    if (s === "cancelled") return "cancelled";
    return s;
  })();

  switch (norm) {
    case "doctor_reschedule":
      return [
        makeBtn(
          "confirmed",
          "Xác nhận",
          "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90",
          <CheckCircle className="inline h-3.5 w-3.5" />
        ),
        makeBtn(
          "cancelled",
          "Hủy",
          "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
          <XCircle className="inline h-3.5 w-3.5" />
        ),
      ];
    case "pending":
      return [
        makeBtn(
          "confirmed",
          "Xác nhận",
          "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90",
          <CheckCircle className="inline h-3.5 w-3.5" />
        ),
        makeBtn(
          "cancelled",
          "Hủy",
          "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
          <XCircle className="inline h-3.5 w-3.5" />
        ),
      ];
    case "confirmed":
      return [
        makeBtn(
          "examining",
          "Bắt đầu khám",
          "bg-purple-600 text-white hover:bg-purple-700"
        ),
        makeBtn(
          "cancelled",
          "Hủy",
          "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
          <XCircle className="inline h-3.5 w-3.5" />
        ),
      ];
    case "examining":
      return [
        makeBtn(
          "prescribing",
          "Kê đơn",
          "bg-indigo-600 text-white hover:bg-indigo-700"
        ),
      ];
    case "prescribing":
      return [
        makeBtn(
          "done",
          "Hoàn thành",
          "bg-emerald-600 text-white hover:bg-emerald-700",
          <CheckCircle className="inline h-3.5 w-3.5" />
        ),
      ];
    default:
      return [];
  }
}
