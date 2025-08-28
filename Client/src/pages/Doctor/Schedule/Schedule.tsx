import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CalendarDays,
  Timer,
  UserCheck,
  MessageSquare,
  Sparkles,
  CircleDot,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { getMySchedules } from "../../../api/scheduleApi";

type Shift = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "accepted" | "rejected" | "busy";
  rejectionReason?: string;
  busyReason?: string;
  adminNote?: string;
  isBooked?: boolean;
};

const DoctorSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBusyModal, setShowBusyModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busyReason, setBusyReason] = useState("");

  const load = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await getMySchedules(user._id);
      const normalized = (data || []).map((s: Shift) => ({
        ...s,
        date: (s.date || "").slice(0, 10),
        startTime: (s.startTime || "").slice(0, 5),
        endTime: (s.endTime || "").slice(0, 5),
      }));
      setShifts(normalized);
    } catch {
      setError("Không tải được ca làm việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const grouped = useMemo(() => {
    const map = new Map<string, Shift[]>();
    shifts.forEach((s) => {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a > b ? 1 : -1));
  }, [shifts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200";
      case "busy":
        return "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200";
      default:
        return "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "rejected":
        return <XCircle className="h-3.5 w-3.5" />;
      case "busy":
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return <CircleDot className="h-3.5 w-3.5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Đã chấp nhận";
      case "rejected":
        return "Đã từ chối";
      case "busy":
        return "Đã báo bận";
      default:
        return "Chờ xác nhận";
    }
  };

  const handleAccept = async (shift: Shift) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/doctor/schedule/${shift._id}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ doctorId: user?._id }),
        }
      );

      if (response.ok) {
        await load(); // Reload data
        setError(""); // Clear any previous errors
      } else {
        setError("Không thể chấp nhận ca làm việc");
      }
    } catch {
      setError("Lỗi kết nối");
    }
  };

  const handleReject = async () => {
    if (!selectedShift || !rejectionReason.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/doctor/schedule/${selectedShift._id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            doctorId: user?._id,
            rejectionReason: rejectionReason.trim(),
          }),
        }
      );

      if (response.ok) {
        await load(); // Reload data
        setShowRejectModal(false);
        setSelectedShift(null);
        setRejectionReason("");
        setError(""); // Clear any previous errors
      } else {
        setError("Không thể từ chối ca làm việc");
      }
    } catch {
      setError("Lỗi kết nối");
    }
  };

  const handleBusy = async () => {
    if (!selectedShift || !busyReason.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/doctor/schedule/${selectedShift._id}/busy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            doctorId: user?._id,
            busyReason: busyReason.trim(),
          }),
        }
      );

      if (response.ok) {
        await load(); // Reload data
        setShowBusyModal(false);
        setSelectedShift(null);
        setBusyReason("");
        setError(""); // Clear any previous errors
      } else {
        setError("Không thể báo bận ca làm việc");
      }
    } catch {
      setError("Lỗi kết nối");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Ca làm việc của tôi
            </h1>
          </div>
          <p className="text-gray-600 ml-14">
            Quản lý lịch trình làm việc cá nhân
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-sm">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium">Đang tải...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {grouped.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có ca làm việc
            </h3>
            <p className="text-gray-500">
              Bạn chưa được phân công ca làm việc nào
            </p>
          </div>
        )}

        {/* Schedule Cards */}
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date} className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                {/* Date Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-white/80 to-gray-50/80 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
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
                        <p className="text-sm text-gray-500 font-mono">
                          {date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-700 font-semibold">
                        {items.length} ca
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shifts */}
                <div className="divide-y divide-gray-100">
                  {items
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(date + "T" + a.startTime + ":00").getTime() -
                        new Date(date + "T" + b.startTime + ":00").getTime()
                    )
                    .map((s) => (
                      <div
                        key={s._id}
                        className="px-8 py-6 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-blue-50/30 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          {/* Shift Info */}
                          <div className="flex items-center gap-6">
                            {/* Time Display */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                                <Timer className="h-4 w-4 text-emerald-600" />
                                <span className="font-mono font-bold text-emerald-700">
                                  {s.startTime}
                                </span>
                              </div>
                              <div className="w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
                              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                                <Timer className="h-4 w-4 text-red-600" />
                                <span className="font-mono font-bold text-red-700">
                                  {s.endTime}
                                </span>
                              </div>
                            </div>

                            {/* Status & Booking Badges */}
                            <div className="flex items-center gap-3">
                              {s.isBooked && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                                  <UserCheck className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm font-semibold text-orange-700">
                                    Đã đặt
                                  </span>
                                </div>
                              )}

                              <div
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${getStatusColor(
                                  s.status
                                )}`}
                              >
                                {getStatusIcon(s.status)}
                                <span className="text-sm font-semibold">
                                  {getStatusText(s.status)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions & Notes */}
                          <div className="flex items-center gap-4">
                            {/* Action Buttons */}
                            {s.status === "pending" && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleAccept(s)}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Chấp nhận
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedShift(s);
                                    setShowRejectModal(true);
                                  }}
                                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Từ chối
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedShift(s);
                                    setShowBusyModal(true);
                                  }}
                                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  Báo bận
                                </button>
                              </div>
                            )}

                            {/* Reason/Note Display */}
                            <div className="flex flex-col gap-2 max-w-xs">
                              {s.rejectionReason && (
                                <div className="px-3 py-2 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-red-700 mb-1">
                                        Lý do từ chối:
                                      </p>
                                      <p className="text-sm text-red-600">
                                        {s.rejectionReason}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {s.busyReason && (
                                <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-amber-700 mb-1">
                                        Lý do bận:
                                      </p>
                                      <p className="text-sm text-amber-600">
                                        {s.busyReason}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {s.adminNote && (
                                <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-blue-700 mb-1">
                                        Ghi chú admin:
                                      </p>
                                      <p className="text-sm text-blue-600">
                                        {s.adminNote}
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

      {/* Reject Modal */}
      {showRejectModal && selectedShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-white/50 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-red-500 to-rose-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <XCircle className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Từ chối ca làm việc
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedShift(null);
                    setRejectionReason("");
                  }}
                  className="text-white/80 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Lý do từ chối *
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 focus:border-red-500 focus:ring-0 transition-all resize-none bg-gray-50 focus:bg-white"
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Vui lòng cung cấp lý do từ chối ca làm việc này..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedShift(null);
                      setRejectionReason("");
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Busy Modal */}
      {showBusyModal && selectedShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-white/50 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-amber-500 to-orange-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Báo bận ca làm việc
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowBusyModal(false);
                    setSelectedShift(null);
                    setBusyReason("");
                  }}
                  className="text-white/80 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Lý do bận *
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 focus:border-amber-500 focus:ring-0 transition-all resize-none bg-gray-50 focus:bg-white"
                    rows={4}
                    value={busyReason}
                    onChange={(e) => setBusyReason(e.target.value)}
                    placeholder="Vui lòng cung cấp lý do bận không thể làm việc..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowBusyModal(false);
                      setSelectedShift(null);
                      setBusyReason("");
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleBusy}
                    disabled={!busyReason.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    Báo bận
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedulePage;
