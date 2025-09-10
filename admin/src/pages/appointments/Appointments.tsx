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
  Clock,
  Filter,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
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
    const q = search.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(
      (a) =>
        a.patientId?.name?.toLowerCase().includes(q) ||
        a.doctorId?.name?.toLowerCase().includes(q) ||
        a.patientId?.phone?.includes(q)
    );
  }, [appointments, search]);

  const onUpdateStatus = async (
    id: string,
    newStatus: Appointment["status"]
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

  const statusOptions: { value: Appointment["status"]; label: string }[] = [
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "examining", label: "Đang khám" },
    { value: "prescribing", label: "Kê đơn" },
    { value: "done", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header + Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Quản lý lịch hẹn</h2>
            </div>
            <p className="text-sm text-gray-600">
              Tổng số: {stats?.total ?? 0}
            </p>
          </div>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:col-span-2">
              <StatCard label="Chờ" value={stats.pending} color="amber" />
              <StatCard label="Xác nhận" value={stats.confirmed} color="blue" />
              <StatCard
                label="Hoàn thành"
                value={stats.completed}
                color="emerald"
              />
              <StatCard label="Hủy" value={stats.cancelled} color="rose" />
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Tất cả</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ngày</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">
                Tìm kiếm
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bệnh nhân / Bác sĩ / SĐT"
                  className="flex-1 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Ngày</Th>
                  <Th>Giờ</Th>
                  <Th>Bệnh nhân</Th>
                  <Th>Bác sĩ</Th>
                  <Th>Trạng thái</Th>
                  <Th>Hành động</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-600">
                      Đang tải...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-600">
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
                    return (
                      <tr key={a._id} className="hover:bg-gray-50">
                        <Td>{dateLabel}</Td>
                        <Td>{timeLabel}</Td>
                        <Td>
                          <div className="font-medium text-gray-900">
                            {a.patientId?.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {a.patientId?.phone}
                          </div>
                        </Td>
                        <Td>
                          <div className="font-medium text-gray-900">
                            {a.doctorId?.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {a.doctorId?.specialty}
                            {a.doctorId?.workplace
                              ? ` • ${a.doctorId.workplace}`
                              : ""}
                          </div>
                        </Td>
                        <Td>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${statusColor(
                              a.status
                            )}`}
                          >
                            {statusText(a.status)}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            {nextStatuses(a.status).map((s) => (
                              <button
                                key={s.value}
                                onClick={() => onUpdateStatus(a._id, s.value)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${s.color}`}
                              >
                                {s.icon}
                                <span className="ml-1">{s.label}</span>
                              </button>
                            ))}
                            <button
                              onClick={() => onDelete(a._id)}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 align-top text-sm text-gray-800">{children}</td>
  );
}

function statusColor(status: Appointment["status"]) {
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
      return "bg-rose-50 text-rose-700 border border-rose-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
}

function statusText(status: Appointment["status"]) {
  switch (status) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Đã xác nhận";
    case "examining":
      return "Đang khám";
    case "prescribing":
      return "Kê đơn";
    case "done":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return "Không xác định";
  }
}

function nextStatuses(current: Appointment["status"]) {
  const makeBtn = (
    value: Appointment["status"],
    label: string,
    color: string,
    icon?: JSX.Element
  ) => ({ value, label, color, icon });

  switch (current) {
    case "pending":
      return [
        makeBtn(
          "confirmed",
          "Xác nhận",
          "bg-blue-600 hover:bg-blue-700 text-white",
          <CheckCircle className="w-3.5 h-3.5 inline" />
        ),
        makeBtn(
          "cancelled",
          "Hủy",
          "bg-rose-600 hover:bg-rose-700 text-white",
          <XCircle className="w-3.5 h-3.5 inline" />
        ),
      ];
    case "confirmed":
      return [
        makeBtn(
          "examining",
          "Bắt đầu khám",
          "bg-purple-600 hover:bg-purple-700 text-white"
        ),
        makeBtn(
          "cancelled",
          "Hủy",
          "bg-rose-600 hover:bg-rose-700 text-white",
          <XCircle className="w-3.5 h-3.5 inline" />
        ),
      ];
    case "examining":
      return [
        makeBtn(
          "prescribing",
          "Kê đơn",
          "bg-indigo-600 hover:bg-indigo-700 text-white"
        ),
        makeBtn(
          "cancelled",
          "Hủy",
          "bg-rose-600 hover:bg-rose-700 text-white",
          <XCircle className="w-3.5 h-3.5 inline" />
        ),
      ];
    case "prescribing":
      return [
        makeBtn(
          "done",
          "Hoàn thành",
          "bg-emerald-600 hover:bg-emerald-700 text-white",
          <CheckCircle className="w-3.5 h-3.5 inline" />
        ),
        makeBtn(
          "cancelled",
          "Hủy",
          "bg-rose-600 hover:bg-rose-700 text-white",
          <XCircle className="w-3.5 h-3.5 inline" />
        ),
      ];
    default:
      return [];
  }
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "amber" | "blue" | "emerald" | "rose";
}) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="text-sm">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
