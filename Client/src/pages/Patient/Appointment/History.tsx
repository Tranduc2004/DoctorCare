import { useEffect, useMemo, useRef, useState } from "react";
import {
  getMyAppointmentHistory,
  getMyAppointments,
} from "../../../api/appointmentApi";
import { useAuth } from "../../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaTimes,
  FaHospital,
  FaTag,
  FaFileCsv,
  FaPrint,
  FaFilePdf,
  FaShareAlt,
  FaCalendarPlus,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";

type StatusKey =
  | "pending"
  | "confirmed"
  | "examining"
  | "prescribing"
  | "done"
  | "cancelled";

type AppointmentItem = {
  _id: string;
  status: StatusKey | string;
  symptoms?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  doctorId?: {
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
  };
};
type TabKey = StatusKey | "all";

const STATUS_META: Record<
  StatusKey,
  { label: string; badge: string; dot: string; colorHex: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
    colorHex: "#f59e0b",
  },
  confirmed: {
    label: "Đã xác nhận",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    colorHex: "#2563eb",
  },
  examining: {
    label: "Đang khám",
    badge: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-500",
    colorHex: "#4f46e5",
  },
  prescribing: {
    label: "Kê đơn",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
    colorHex: "#0ea5e9",
  },
  done: {
    label: "Hoàn thành",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    colorHex: "#16a34a",
  },
  cancelled: {
    label: "Đã hủy",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    colorHex: "#dc2626",
  },
};
const STATUS_ORDER: StatusKey[] = [
  "pending",
  "confirmed",
  "examining",
  "prescribing",
  "done",
];

function initials(name?: string) {
  if (!name) return "BS";
  const p = name.trim().split(/\s+/);
  return `${(p[0]?.[0] || "").toUpperCase()}${(
    p[p.length - 1]?.[0] || ""
  ).toUpperCase()}`;
}
function formatDate(d?: string) {
  if (!d) return "--";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}
function formatRange(s?: string, e?: string) {
  if (!s || !e) return "--";
  return `${s} – ${e}`;
}
function parseService(note?: string) {
  if (!note) return "";
  const m = note.match(/\[Dịch vụ\]\s*([^|]+)/);
  return m?.[1]?.trim() || "";
}

function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <FaTimes />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stepper({
  current,
  cancelled,
}: {
  current: StatusKey;
  cancelled?: boolean;
}) {
  const idx = Math.max(STATUS_ORDER.indexOf(current), 0);
  return (
    <div className="flex items-center gap-2">
      {STATUS_ORDER.map((st, i) => {
        const active = i <= idx && !cancelled;
        return (
          <div key={st} className="flex items-center gap-2">
            <div
              className={`h-2 w-8 rounded ${
                i === 0 ? "hidden" : active ? "bg-teal-500" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-6 w-6 shrink-0 rounded-full border text-[10px] font-semibold flex items-center justify-center ${
                cancelled
                  ? "border-red-400 text-red-600"
                  : active
                  ? "border-teal-500 text-teal-600"
                  : "border-gray-300 text-gray-400"
              }`}
              title={STATUS_META[st].label}
            >
              {i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AppointmentHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AppointmentItem[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const PAGE = 12;
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => setLimit(PAGE), [activeTab, q, from, to]);

  const [detail, setDetail] = useState<AppointmentItem | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      if (!user?._id) return;
      setLoading(true);
      setError("");
      try {
        // Merge current + history and de-duplicate by id
        const [current, past] = await Promise.all([
          getMyAppointments(user._id).catch(() => []),
          getMyAppointmentHistory(user._id).catch(() => []),
        ]);
        const map = new Map<string, AppointmentItem>();
        [
          ...(Array.isArray(current) ? current : []),
          ...(Array.isArray(past) ? past : []),
        ].forEach((it: any) => {
          map.set(String(it._id), it as AppointmentItem);
        });
        const merged = Array.from(map.values()).sort((a, b) => {
          const ak = `${a.scheduleId?.date ?? a.updatedAt}${
            a.scheduleId?.startTime ?? ""
          }`;
          const bk = `${b.scheduleId?.date ?? b.updatedAt}${
            b.scheduleId?.startTime ?? ""
          }`;
          return bk.localeCompare(ak);
        });
        setItems(merged);
      } catch {
        setError("Không tải được lịch sử lịch hẹn");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?._id]);

  const filtered = useMemo(() => {
    const base =
      activeTab === "all"
        ? items
        : items.filter((it) => (it.status as StatusKey) === activeTab);
    const norm = (s: string) => s.toLowerCase();
    const inRange = (iso?: string) => {
      if (!iso) return true;
      const d = new Date(iso).toISOString().slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };
    return base.filter((it) => {
      const hay = `${it.doctorId?.name || ""} ${it.symptoms || ""} ${
        it.note || ""
      }`;
      const okQ = q ? norm(hay).includes(norm(q)) : true;
      const dateKey = it.scheduleId?.date || it.updatedAt;
      return okQ && inRange(dateKey);
    });
  }, [items, activeTab, q, from, to]);

  const groups = useMemo(() => {
    const map: Record<string, AppointmentItem[]> = {};
    filtered.slice(0, limit).forEach((it) => {
      const key = (it.scheduleId?.date || it.updatedAt).slice(0, 10);
      (map[key] ||= []).push(it);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) =>
        (a.scheduleId?.startTime ?? "").localeCompare(
          b.scheduleId?.startTime ?? ""
        )
      )
    );
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered, limit]);

  function exportCSV(rows: AppointmentItem[]) {
    const header = [
      "id",
      "status",
      "doctor",
      "specialty",
      "workplace",
      "date",
      "start",
      "end",
      "symptoms",
      "note",
    ];
    const body = rows.map((r) => [
      r._id,
      r.status,
      r.doctorId?.name || "",
      r.doctorId?.specialty || "",
      r.doctorId?.workplace || "",
      r.scheduleId?.date || "",
      r.scheduleId?.startTime || "",
      r.scheduleId?.endTime || "",
      (r.symptoms || "").replace(/\n|\r/g, " "),
      (r.note || "").replace(/\n|\r/g, " "),
    ]);
    const csv = [header, ...body]
      .map((arr) =>
        arr.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadICS(appt: AppointmentItem) {
    const title = `Khám với ${appt.doctorId?.name || "Bác sĩ"}`;
    const date =
      appt.scheduleId?.date ||
      new Date(appt.updatedAt).toISOString().slice(0, 10);
    const toDT = (d: string, t = "00:00") =>
      `${d.replace(/-/g, "")}T${t.replace(":", "")}00`;
    const dtStart = toDT(date, appt.scheduleId?.startTime || "08:00");
    const dtEnd = toDT(date, appt.scheduleId?.endTime || "09:00");
    const description = [parseService(appt.note), appt.symptoms, appt.note]
      .filter(Boolean)
      .join(" \n");
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MediCare//Appointments//VN
BEGIN:VEVENT
UID:${appt._id}@medicare
DTSTAMP:${toDT(new Date().toISOString().slice(0, 10), "00:00")}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointment_${appt._id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printList() {
    const node = printRef.current;
    if (!node) return window.print();
    const w = window.open("", "_blank");
    if (!w) return;
    w.document
      .write(`<!doctype html><html><head><meta charset="utf-8" /><title>Lịch hẹn</title>
      <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px} .card{border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-bottom:8px} .muted{color:#6b7280;font-size:12px}</style></head><body>`);
    w.document.write(`<h2>Danh sách lịch hẹn (${filtered.length})</h2>`);
    w.document.write(node.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  return (
    <div className="min-h-[70vh] bg-gray-50">
      <div className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-7">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Lịch sử & tình trạng lịch hẹn
          </h1>
          <p className="text-white/90">
            lịch sử đặt lịch khám với bác sĩ của bạn
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                "all",
                "pending",
                "confirmed",
                "examining",
                "prescribing",
                "done",
                "cancelled",
              ] as TabKey[]
            ).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  activeTab === t
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t === "all" ? "Tất cả" : STATUS_META[t as StatusKey].label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm bác sĩ/ghi chú..."
                className="w-56 rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Từ</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
              />
              <span className="text-gray-500">đến</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
              />
              {(from || to) && (
                <button
                  onClick={() => {
                    setFrom("");
                    setTo("");
                  }}
                  className="rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50"
                >
                  Xóa
                </button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => exportCSV(filtered)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <FaFileCsv /> CSV
              </button>
              <button
                onClick={printList}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <FaPrint /> In / PDF
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-gray-200/60 animate-pulse"
              />
            ))}
          </div>
        )}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            Chưa có lịch hẹn phù hợp bộ lọc.
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="space-y-8" ref={printRef}>
            {groups.map(([day, list]) => (
              <section key={day}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    {formatDate(day)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {list.length} lịch hẹn
                  </span>
                </div>

                <ol className="relative ml-3 border-l-2 border-gray-200">
                  {list.map((it) => {
                    const key =
                      (it.status as StatusKey) in STATUS_META
                        ? (it.status as StatusKey)
                        : "pending";
                    const meta = STATUS_META[key];
                    const service = parseService(it.note);
                    return (
                      <li key={it._id} className="mb-6 ml-4">
                        <span
                          className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full ${meta.dot}`}
                        ></span>
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                                {initials(it.doctorId?.name)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {it.doctorId?.name || "Bác sĩ"}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {it.doctorId?.specialty || ""}
                                  {it.doctorId?.workplace
                                    ? ` • ${it.doctorId.workplace}`
                                    : ""}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${meta.badge}`}
                            >
                              {meta.label}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                              <FaCalendarAlt className="text-gray-400" />
                              {formatDate(it.scheduleId?.date || it.updatedAt)}
                            </div>
                            {it.scheduleId?.startTime &&
                              it.scheduleId?.endTime && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <FaClock className="text-gray-400" />
                                  {formatRange(
                                    it.scheduleId.startTime,
                                    it.scheduleId.endTime
                                  )}
                                </div>
                              )}
                            {service && (
                              <div className="col-span-2 flex items-center gap-2 text-gray-700">
                                <FaTag className="text-gray-400" /> {service}
                              </div>
                            )}
                          </div>

                          {it.symptoms && (
                            <div className="mt-2 text-sm text-gray-700">
                              <span className="font-medium">Triệu chứng: </span>
                              {it.symptoms}
                            </div>
                          )}
                          {it.note && (
                            <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                              {it.note}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <button
                              onClick={() => setDetail(it)}
                              className="rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => downloadICS(it)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50"
                            >
                              <FaCalendarPlus /> Thêm vào lịch
                            </button>
                            <button
                              onClick={() => {
                                try {
                                  navigator.share?.({
                                    title: "Lịch khám",
                                    text: `${formatDate(
                                      it.scheduleId?.date
                                    )} ${formatRange(
                                      it.scheduleId?.startTime,
                                      it.scheduleId?.endTime
                                    )} - ${it.doctorId?.name}`,
                                  });
                                } catch {}
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50"
                            >
                              <FaShareAlt /> Chia sẻ
                            </button>
                            <a
                              href={`/appointment?doctorId=${
                                it.doctorId?._id || ""
                              }`}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50"
                            >
                              Đặt lại
                            </a>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
            {limit < filtered.length && (
              <div className="flex justify-center">
                <button
                  onClick={() => setLimit((l) => l + PAGE)}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  Tải thêm
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Chi tiết lịch hẹn"
      >
        {detail && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-base font-semibold text-gray-700">
                  {initials(detail.doctorId?.name)}
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {detail.doctorId?.name || "Bác sĩ"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {detail.doctorId?.specialty || ""}
                    {detail.doctorId?.workplace
                      ? ` • ${detail.doctorId.workplace}`
                      : ""}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Trạng thái</div>
                <div
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                    STATUS_META[
                      (detail.status as StatusKey) in STATUS_META
                        ? (detail.status as StatusKey)
                        : "pending"
                    ].badge
                  }`}
                >
                  {
                    STATUS_META[
                      (detail.status as StatusKey) in STATUS_META
                        ? (detail.status as StatusKey)
                        : "pending"
                    ].label
                  }
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3">
              <div className="mb-2 text-xs text-gray-500">Tiến trình</div>
              <Stepper
                current={
                  (detail.status as StatusKey) in STATUS_META
                    ? (detail.status as StatusKey)
                    : "pending"
                }
                cancelled={detail.status === "cancelled"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 text-xs text-gray-500">Lịch khám</div>
                <div className="flex items-center gap-2 text-gray-800">
                  <FaCalendarAlt className="text-gray-400" />{" "}
                  {formatDate(detail.scheduleId?.date || detail.updatedAt)}
                </div>
                <div className="mt-1 flex items-center gap-2 text-gray-800">
                  <FaClock className="text-gray-400" />{" "}
                  {formatRange(
                    detail.scheduleId?.startTime,
                    detail.scheduleId?.endTime
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 text-xs text-gray-500">
                  Cơ sở & liên hệ
                </div>
                <div className="flex items-center gap-2 text-gray-800">
                  <FaHospital className="text-gray-400" />{" "}
                  {detail.doctorId?.workplace || "—"}
                </div>
                <div className="mt-1 flex items-center gap-2 text-gray-800">
                  <FaMapMarkerAlt className="text-gray-400" /> Quầy tiếp đón •
                  Tầng 1
                </div>
                <div className="mt-1 flex items-center gap-2 text-gray-800">
                  <FaPhone className="text-gray-400" /> 1900 0000
                </div>
                <div className="mt-1 flex items-center gap-2 text-gray-800">
                  <FaEnvelope className="text-gray-400" /> support@medicare.vn
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 text-xs text-gray-500">Triệu chứng</div>
                <div className="whitespace-pre-wrap text-gray-800">
                  {detail.symptoms || "—"}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 text-xs text-gray-500">Ghi chú</div>
                <div className="whitespace-pre-wrap text-gray-800">
                  {detail.note || "—"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => downloadICS(detail)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <FaCalendarPlus /> Thêm vào lịch
              </button>
              <button
                onClick={() => {
                  try {
                    navigator.share?.({
                      title: "Lịch khám",
                      text: `${formatDate(
                        detail.scheduleId?.date
                      )} ${formatRange(
                        detail.scheduleId?.startTime,
                        detail.scheduleId?.endTime
                      )} - ${detail.doctorId?.name}`,
                    });
                  } catch {}
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <FaShareAlt /> Chia sẻ
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <FaFilePdf /> In / Lưu PDF
              </button>
            </div>

            <div className="text-xs text-gray-500">
              Tạo lúc {formatDate(detail.createdAt)} • Cập nhật{" "}
              {formatDate(detail.updatedAt)} • Mã: {detail._id}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
