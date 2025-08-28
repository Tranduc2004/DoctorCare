import React, { useEffect, useMemo, useState } from "react";
import {
  adminGetDoctorsByStatus,
  adminGetDoctorShifts,
  adminBulkCreateDoctorShifts,
  adminDeleteDoctorShift,
  adminGetAllShifts,
  adminGetPendingShifts,
  adminReplaceDoctor,
} from "../../api/adminApi";
import {
  FaRegCalendarAlt,
  FaListAlt,
  FaPlus,
  FaTrash,
  FaExclamationTriangle,
  FaFastForward,
  FaUserMd,
  FaRegClock,
  FaCalendarAlt,
  FaExchangeAlt,
} from "react-icons/fa";
import { useAdminAuth } from "../../hooks/useAdminAuth";

type Doctor = {
  _id: string;
  name?: string;
  email: string;
  specialty?: string;
};

type Shift = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "accepted" | "rejected" | "busy";
  rejectionReason?: string;
  busyReason?: string;
  adminNote?: string;
  doctorId?: { _id: string; name?: string; email: string; specialty?: string };
};

const DoctorSchedule: React.FC = () => {
  const { token } = useAdminAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [globalShifts, setGlobalShifts] = useState<Shift[]>([]);
  const [pendingShifts, setPendingShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [repeatDays, setRepeatDays] = useState<number>(0); // số ngày nhân bản nhanh
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedShiftForReplacement, setSelectedShiftForReplacement] =
    useState<Shift | null>(null);
  const [replacementDoctorId, setReplacementDoctorId] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");

  useEffect(() => {
    const loadDoctors = async () => {
      if (!token) return;
      try {
        const res = await adminGetDoctorsByStatus(token, "approved");
        setDoctors(res.data || []);
      } catch (e) {
        setError("Không tải được danh sách bác sĩ");
      }
    };
    loadDoctors();
  }, [token]);

  // Generate time slots from 6 AM to 10 PM
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeString);
      }
    }
    return slots;
  }, []);

  // Generate next 14 days
  const dates = useMemo(() => {
    const dateList = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dateList.push(date.toISOString().split("T")[0]);
    }
    return dateList;
  }, []);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d._id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const loadShifts = async () => {
    if (!token || !selectedDoctorId) return;
    setLoading(true);
    try {
      const res = await adminGetDoctorShifts(token, selectedDoctorId);
      const normalized = (res.data || []).map((s: Shift) => ({
        ...s,
        date: (s.date || "").split("T")[0],
        startTime: (s.startTime || "").slice(0, 5),
        endTime: (s.endTime || "").slice(0, 5),
      }));
      setShifts(normalized);
    } catch (e) {
      setError("Không tải được lịch làm việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedSlots([]);
    loadShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctorId]);

  useEffect(() => {
    const loadAll = async () => {
      if (!token) return;
      try {
        const res = await adminGetAllShifts(token);
        const normalized = (res.data || []).map((s: Shift) => ({
          ...s,
          date: (s.date || "").split("T")[0],
          startTime: (s.startTime || "").slice(0, 5),
          endTime: (s.endTime || "").slice(0, 5),
        }));
        setGlobalShifts(normalized);
      } catch (e) {
        // ignore
      }
    };
    loadAll();
  }, [token]);

  // Load pending shifts
  useEffect(() => {
    const loadPending = async () => {
      if (!token) return;
      try {
        const res = await adminGetPendingShifts(token);
        const normalized = (res.data || []).map((s: Shift) => ({
          ...s,
          date: (s.date || "").split("T")[0],
          startTime: (s.startTime || "").slice(0, 5),
          endTime: (s.endTime || "").slice(0, 5),
        }));
        setPendingShifts(normalized);
      } catch (e) {
        // ignore
      }
    };
    loadPending();
  }, [token]);

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map((x) => parseInt(x, 10));
    return h * 60 + (isNaN(m) ? 0 : m);
  };

  // Check if a time slot is occupied
  const isSlotOccupied = (date: string, time: string) => {
    const data = selectedDoctorId ? shifts : globalShifts;
    const slotMin = toMinutes(time);
    return data.some((shift) => {
      if (shift.date !== date) return false;
      const startMin = toMinutes(shift.startTime);
      const endMin = toMinutes(shift.endTime);
      return slotMin >= startMin && slotMin < endMin;
    });
  };

  const getSlotStatus = (date: string, time: string) => {
    if (isSlotOccupied(date, time)) return "occupied";
    const slotId = `${date}-${time}`;
    if (selectedSlots.includes(slotId)) return "selected";
    return "available";
  };

  const isPastSlot = (date: string, time: string) => {
    try {
      const slotDate = new Date(`${date}T${time}:00`);
      const now = new Date();
      return slotDate.getTime() < now.getTime();
    } catch {
      return false;
    }
  };

  const toggleSlot = (date: string, time: string) => {
    if (!selectedDoctorId) return; // chỉ chọn khi đã chọn bác sĩ
    const slotId = `${date}-${time}`;
    if (isSlotOccupied(date, time)) return;

    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  // Nhân bản các slot đã chọn sang N ngày tiếp theo kể từ ngày đầu tiên của lựa chọn
  const replicateSelectedAcrossDays = () => {
    if (!selectedDoctorId || selectedSlots.length === 0 || repeatDays <= 0) {
      return;
    }
    // Lấy các ngày đang chọn theo thứ tự tăng dần
    const selectedDates = Array.from(
      new Set(selectedSlots.map((s) => s.slice(0, 10)))
    ).sort();
    if (selectedDates.length === 0) return;

    // Dùng ngày đầu tiên làm mốc mẫu
    const baseDateStr = selectedDates[0];
    const baseTimes = selectedSlots
      .filter((s) => s.startsWith(baseDateStr))
      .map((s) => s.slice(11))
      .sort();
    if (baseTimes.length === 0) return;

    const addDays = (dateStr: string, delta: number) => {
      const d = new Date(dateStr + "T00:00:00");
      d.setDate(d.getDate() + delta);
      return d.toISOString().slice(0, 10);
    };

    const newSlots: string[] = [];
    for (let i = 1; i <= repeatDays; i++) {
      const targetDate = addDays(baseDateStr, i);
      // Bỏ qua nếu không nằm trong mảng dates hiển thị để tránh nhầm lẫn
      if (!dates.includes(targetDate)) continue;
      baseTimes.forEach((time) => {
        if (
          !isPastSlot(targetDate, time) &&
          !isSlotOccupied(targetDate, time)
        ) {
          newSlots.push(`${targetDate}-${time}`);
        }
      });
    }
    if (newSlots.length === 0) return;

    setSelectedSlots((prev) => Array.from(new Set([...prev, ...newSlots])));
  };

  const createShiftsFromSelected = async () => {
    if (!token || !selectedDoctorId || selectedSlots.length === 0) return;

    // Gom các slot liên tiếp trong cùng ngày thành ca
    const groupedSlots = selectedSlots.reduce((acc, slotId) => {
      // slotId format: YYYY-MM-DD-HH:mm → cannot split by '-' directly
      const date = slotId.slice(0, 10);
      const time = slotId.slice(11);
      if (!acc[date]) acc[date] = [] as string[];
      acc[date].push(time);
      return acc;
    }, {} as Record<string, string[]>);

    const slots: { date: string; startTime: string; endTime: string }[] = [];
    Object.entries(groupedSlots).forEach(([date, times]) => {
      times.sort();
      // Hợp nhất thành nhiều khoảng liên tiếp (mỗi slot 30 phút)
      let start = times[0];
      let prev = times[0];
      const add30 = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        const nh = m === 30 ? h + 1 : h;
        const nm = m === 30 ? 0 : 30;
        return `${nh.toString().padStart(2, "0")}:${nm
          .toString()
          .padStart(2, "0")}`;
      };

      for (let i = 1; i < times.length; i++) {
        const expectedNext = add30(prev);
        if (times[i] !== expectedNext) {
          // kết thúc một đoạn
          const end = add30(prev);
          slots.push({ date, startTime: start, endTime: end });
          start = times[i];
        }
        prev = times[i];
      }
      // đoạn cuối
      slots.push({ date, startTime: start, endTime: add30(prev) });
    });

    // Validate: tổng số giờ mỗi ngày không vượt quá 8 giờ
    const minutesInNewByDate = new Map<string, number>();
    slots.forEach((s) => {
      const mins = toMinutes(s.endTime) - toMinutes(s.startTime);
      minutesInNewByDate.set(
        s.date,
        (minutesInNewByDate.get(s.date) || 0) + mins
      );
    });

    const minutesInExistingByDate = new Map<string, number>();
    shifts.forEach((s) => {
      const mins = toMinutes(s.endTime) - toMinutes(s.startTime);
      minutesInExistingByDate.set(
        s.date,
        (minutesInExistingByDate.get(s.date) || 0) + mins
      );
    });

    const exceededDate = Array.from(minutesInNewByDate.entries()).find(
      ([date, mins]) => mins + (minutesInExistingByDate.get(date) || 0) > 8 * 60
    );

    if (exceededDate) {
      const [date] = exceededDate;
      setError(
        `Tổng thời gian trong ngày ${date} vượt quá 8 giờ. Vui lòng giảm số ca.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await adminBulkCreateDoctorShifts(token, {
        doctorId: selectedDoctorId,
        slots,
      });
      setSelectedSlots([]);
      // Reload cả view theo bác sĩ và toàn bộ để đồng bộ
      await loadShifts();
      try {
        const all = await adminGetAllShifts(token);
        setGlobalShifts(all.data || []);
      } catch {}

      // Overtime notice: nếu làm đủ 8 ngày liên tục trong 8 ngày tới → cảnh báo tăng ca
      try {
        const today = new Date();
        const next8Dates = new Set<string>();
        for (let i = 0; i < 8; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          next8Dates.add(d.toISOString().slice(0, 10));
        }

        const datesWorked = new Set<string>();
        const dataset =
          (await adminGetDoctorShifts(token, selectedDoctorId)).data || [];
        (dataset as any[]).forEach((s: any) => {
          const d = (s.date || "").slice(0, 10);
          if (next8Dates.has(d)) datesWorked.add(d);
        });

        if (datesWorked.size >= 8) {
          window.alert(
            "Bác sĩ làm đủ 8 ngày liên tiếp trong tuần tới. Đây là tăng ca."
          );
        }
      } catch {}
    } catch (e) {
      setError("Không tạo được ca làm việc");
    } finally {
      setLoading(false);
    }
  };

  const deleteShift = async (id: string) => {
    if (!token) return;
    const ok = window.confirm("Bạn có chắc muốn xóa ca làm việc này không?");
    if (!ok) return;
    setLoading(true);
    try {
      await adminDeleteDoctorShift(token, id);
      await loadShifts();
      try {
        const all = await adminGetAllShifts(token);
        setGlobalShifts(all.data || []);
      } catch {}
    } catch (e) {
      setError("Không xóa được ca làm việc");
    } finally {
      setLoading(false);
    }
  };

  const replaceDoctor = async () => {
    if (!token || !selectedShiftForReplacement || !replacementDoctorId) return;

    setLoading(true);
    try {
      await adminReplaceDoctor(token, selectedShiftForReplacement._id, {
        newDoctorId: replacementDoctorId,
        adminNote,
      });

      // Reload data
      await loadShifts();
      try {
        const all = await adminGetAllShifts(token);
        setGlobalShifts(all.data || []);
        const pending = await adminGetPendingShifts(token);
        setPendingShifts(pending.data || []);
      } catch {}

      // Reset modal
      setShowPendingModal(false);
      setSelectedShiftForReplacement(null);
      setReplacementDoctorId("");
      setAdminNote("");

      setError(""); // Clear any previous errors
    } catch (e) {
      setError("Không thay thế được bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Hôm nay";
    if (date.toDateString() === tomorrow.toDateString()) return "Ngày mai";

    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <span className="inline-flex items-center gap-2">
                  <FaRegCalendarAlt /> Lịch làm việc bác sĩ
                </span>
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý ca làm việc theo ngày và giờ
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-xl shadow-sm border p-1">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === "calendar"
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <FaCalendarAlt /> Lịch
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <FaListAlt /> Danh sách
                  </span>
                </button>
              </div>

              {/* Pending Shifts Button */}
              <button
                onClick={() => setShowPendingModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FaExclamationTriangle />
                Ca cần xử lý ({pendingShifts.length})
              </button>
            </div>
          </div>

          {/* Doctor Selection */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/50 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-2">
                    <FaUserMd /> Chọn bác sĩ
                  </span>
                </label>
                <select
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-0 transition-all"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name || d.email}{" "}
                      {d.specialty ? `- ${d.specialty}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-2">
                    <FaCalendarAlt /> Ngày hiện tại
                  </span>
                </label>
                <input
                  type="date"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-0 transition-all"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="flex items-end gap-3">
                {/* Nhân bản nhanh */}
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="number"
                    min={0}
                    max={13}
                    className="w-24 border-2 border-gray-200 rounded-xl px-3 py-3 focus:border-blue-500 focus:ring-0 transition-all"
                    value={repeatDays}
                    onChange={(e) =>
                      setRepeatDays(
                        Math.max(0, Math.min(13, Number(e.target.value) || 0))
                      )
                    }
                    placeholder="0"
                    title="Số ngày tiếp theo để nhân bản slot"
                  />
                  <button
                    onClick={replicateSelectedAcrossDays}
                    className="px-4 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-all shadow"
                    disabled={
                      loading ||
                      !selectedDoctorId ||
                      selectedSlots.length === 0 ||
                      repeatDays <= 0
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaFastForward /> Nhân bản
                    </span>
                  </button>
                </div>

                {selectedSlots.length > 0 && (
                  <button
                    onClick={createShiftsFromSelected}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
                    disabled={loading || !selectedDoctorId}
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaPlus /> Tạo ca ({selectedSlots.length} slot)
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-600 inline-flex items-center gap-2">
            <FaExclamationTriangle /> {error}
          </div>
        )}

        <>
          {viewMode === "calendar" ? (
            /* Calendar View */
            <div className="bg-white rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedDoctorId
                        ? selectedDoctor?.name || selectedDoctor?.email
                        : "Tất cả bác sĩ"}
                    </h2>
                    {selectedDoctorId && (
                      <p className="text-blue-100">
                        {selectedDoctor?.specialty}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-100">
                      Tổng ca làm việc
                    </div>
                    <div className="text-2xl font-bold">
                      {(selectedDoctorId ? shifts : globalShifts).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Đã đặt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Đang chọn</span>
                  </div>
                </div>
              </div>

              {/* Time Grid */}
              <div className="p-6 overflow-x-auto">
                <div className="grid grid-cols-[100px_repeat(14,1fr)] gap-1 min-w-[1200px]">
                  {/* Empty corner */}
                  <div className="font-semibold text-gray-600 p-2">Giờ</div>

                  {/* Date headers */}
                  {dates.map((date) => (
                    <div
                      key={date}
                      className="text-center p-2 font-semibold text-gray-700 text-sm"
                    >
                      {formatDateHeader(date)}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(date + "T00:00:00").getDate()}
                      </div>
                    </div>
                  ))}

                  {/* Time slots */}
                  {timeSlots.map((time) => (
                    <React.Fragment key={time}>
                      {/* Time label */}
                      <div className="text-sm text-gray-600 p-2 font-medium">
                        {time}
                      </div>

                      {/* Slots for each date */}
                      {dates.map((date) => {
                        const status = getSlotStatus(date, time);
                        // tìm ca trùng để ghi chú bác sĩ
                        const dataset = selectedDoctorId
                          ? shifts
                          : globalShifts;
                        const covering = dataset.find((s) => {
                          if (s.date !== date) return false;
                          const t = toMinutes(time);
                          const st = toMinutes(s.startTime);
                          const et = toMinutes(s.endTime);
                          return t >= st && t < et;
                        });
                        const past = isPastSlot(date, time);
                        return (
                          <button
                            key={`${date}-${time}`}
                            onClick={() => toggleSlot(date, time)}
                            className={`h-8 w-full rounded-md border-2 transition-all hover:scale-110 ${
                              past
                                ? "bg-gray-300 border-gray-400 cursor-not-allowed"
                                : status === "occupied"
                                ? "bg-red-500 border-red-600 cursor-not-allowed"
                                : status === "selected"
                                ? "bg-blue-500 border-blue-600 shadow-lg cursor-pointer"
                                : "bg-green-500 border-green-600 hover:bg-green-600 cursor-pointer"
                            }`}
                            disabled={
                              past || status === "occupied" || !selectedDoctorId
                            }
                            title={
                              past
                                ? "Đã qua - Không thể chọn"
                                : status === "occupied"
                                ? `Đã có ca làm việc${
                                    covering?.doctorId
                                      ? ` - ${
                                          covering.doctorId.name ||
                                          covering.doctorId.email
                                        }`
                                      : ""
                                  }`
                                : !selectedDoctorId
                                ? "Chọn bác sĩ để tạo ca"
                                : status === "selected"
                                ? "Đang chọn - Click để bỏ chọn"
                                : "Trống - Click để chọn"
                            }
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border-t border-blue-200 p-4">
                <p className="text-blue-700 text-sm flex items-center gap-2">
                  <FaExclamationTriangle className="text-blue-600" />{" "}
                  <strong>Hướng dẫn:</strong> Click vào các ô xanh để chọn múi
                  giờ trống, sau đó nhấn "Tạo ca" để tạo ca làm việc.
                </p>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Danh sách ca làm việc</h2>
                    {selectedDoctorId ? (
                      <p className="text-blue-100">
                        {selectedDoctor?.name || selectedDoctor?.email} -{" "}
                        {selectedDoctor?.specialty}
                      </p>
                    ) : (
                      <p className="text-blue-100">Tất cả bác sĩ</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-100">Tổng số ca</div>
                    <div className="text-2xl font-bold">
                      {(selectedDoctorId ? shifts : globalShifts).length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-700">
                      <th className="px-6 py-4 font-semibold">📅 Ngày</th>
                      <th className="px-6 py-4 font-semibold">🕐 Bắt đầu</th>
                      <th className="px-6 py-4 font-semibold">🕕 Kết thúc</th>
                      {!selectedDoctorId && (
                        <th className="px-6 py-4 font-semibold">👨‍⚕️ Bác sĩ</th>
                      )}
                      <th className="px-6 py-4 font-semibold">⏱️ Thời gian</th>
                      <th className="px-6 py-4 font-semibold text-right">
                        ⚡ Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedDoctorId ? shifts : globalShifts)
                      .sort(
                        (a, b) =>
                          new Date(
                            a.date + "T" + a.startTime + ":00"
                          ).getTime() -
                          new Date(b.date + "T" + b.startTime + ":00").getTime()
                      )
                      .map((shift, index) => {
                        const durationHours = Math.max(
                          0,
                          (toMinutes(shift.endTime) -
                            toMinutes(shift.startTime)) /
                            60
                        );

                        return (
                          <tr
                            key={shift._id}
                            className={`border-t transition-all hover:bg-blue-50 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                  {new Date(shift.date + "T00:00:00").getDate()}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {new Date(
                                      shift.date + "T00:00:00"
                                    ).toLocaleDateString("vi-VN", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {shift.date}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FaRegClock className="text-green-600" />
                                <span className="font-mono font-medium">
                                  {shift.startTime}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FaRegClock className="text-red-500" />
                                <span className="font-mono font-medium">
                                  {shift.endTime}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {durationHours}h
                              </span>
                            </td>
                            {!selectedDoctorId && (
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm">
                                  {shift.doctorId?.name ||
                                    shift.doctorId?.email ||
                                    "-"}
                                </span>
                              </td>
                            )}
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => deleteShift(shift._id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg font-medium"
                                disabled={loading}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <FaTrash /> Xóa
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {(selectedDoctorId ? shifts : globalShifts).length ===
                      0 && (
                      <tr>
                        <td
                          className="px-6 py-12 text-center text-gray-500"
                          colSpan={selectedDoctorId ? 5 : 6}
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="text-6xl">📅</div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-600 mb-2">
                                Chưa có ca làm việc
                              </h3>
                              <p className="text-gray-500">
                                Chuyển sang chế độ Lịch để thêm ca làm việc mới
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {shifts.length}
                  </div>
                  <div className="text-sm text-gray-600">Tổng ca</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {shifts.reduce((total, shift) => {
                      const diff =
                        (toMinutes(shift.endTime) -
                          toMinutes(shift.startTime)) /
                        60;
                      return (
                        total + Math.max(0, Number.isFinite(diff) ? diff : 0)
                      );
                    }, 0)}
                    h
                  </div>
                  <div className="text-sm text-gray-600">Tổng giờ</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔄</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedSlots.length}
                  </div>
                  <div className="text-sm text-gray-600">Đang chọn</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {[...new Set(shifts.map((s) => s.date))].length}
                  </div>
                  <div className="text-sm text-gray-600">Ngày có ca</div>
                </div>
              </div>
            </div>
          </div>
        </>

        {/* Pending Shifts Modal */}
        {showPendingModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto ">
              <div className="flex items-center justify-between mb-6  ">
                <h2 className="text-2xl font-bold text-purple-600">
                  Ca làm việc cần xử lý
                </h2>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {pendingShifts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không có ca nào cần xử lý
                  </div>
                ) : (
                  pendingShifts.map((shift) => (
                    <div
                      key={shift._id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                            {new Date(shift.date + "T00:00:00").getDate()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {new Date(
                                shift.date + "T00:00:00"
                              ).toLocaleDateString("vi-VN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {shift.startTime} - {shift.endTime}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              shift.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : shift.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {shift.status === "pending"
                              ? "Chờ xác nhận"
                              : shift.status === "rejected"
                              ? "Từ chối"
                              : "Báo bận"}
                          </span>

                          <button
                            onClick={() => {
                              setSelectedShiftForReplacement(shift);
                              setReplacementDoctorId("");
                              setAdminNote("");
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            <FaExchangeAlt className="inline mr-1" />
                            Thay thế
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-sm text-gray-600">
                          <strong>Bác sĩ:</strong>{" "}
                          {shift.doctorId?.name || shift.doctorId?.email}
                          {shift.doctorId?.specialty &&
                            ` - ${shift.doctorId.specialty}`}
                        </div>
                      </div>

                      {shift.rejectionReason && (
                        <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-sm font-medium text-red-800 mb-1">
                            Lý do từ chối:
                          </div>
                          <div className="text-sm text-red-700">
                            {shift.rejectionReason}
                          </div>
                        </div>
                      )}

                      {shift.busyReason && (
                        <div className="mb-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="text-sm font-medium text-orange-800 mb-1">
                            Lý do bận:
                          </div>
                          <div className="text-sm text-orange-700">
                            {shift.busyReason}
                          </div>
                        </div>
                      )}

                      {shift.adminNote && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 mb-1">
                            Ghi chú admin:
                          </div>
                          <div className="text-sm text-blue-700">
                            {shift.adminNote}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Replace Doctor Modal */}
        {selectedShiftForReplacement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Thay thế bác sĩ
                </h2>
                <button
                  onClick={() => {
                    setSelectedShiftForReplacement(null);
                    setReplacementDoctorId("");
                    setAdminNote("");
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bác sĩ mới
                  </label>
                  <select
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-0 transition-all"
                    value={replacementDoctorId}
                    onChange={(e) => setReplacementDoctorId(e.target.value)}
                  >
                    <option value="">Chọn bác sĩ</option>
                    {doctors
                      .filter(
                        (d) =>
                          d._id !== selectedShiftForReplacement.doctorId?._id
                      )
                      .map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name || d.email}{" "}
                          {d.specialty ? `- ${d.specialty}` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-0 transition-all"
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Ghi chú về việc thay thế bác sĩ..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedShiftForReplacement(null);
                      setReplacementDoctorId("");
                      setAdminNote("");
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={replaceDoctor}
                    disabled={!replacementDoctorId || loading}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Đang xử lý..." : "Thay thế"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSchedule;
