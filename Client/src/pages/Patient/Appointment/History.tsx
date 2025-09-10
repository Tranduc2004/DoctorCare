import { useEffect, useState } from "react";
import { getMyAppointmentHistory } from "../../../api/appointmentApi";
import { useAuth } from "../../../contexts/AuthContext";

type AppointmentItem = {
  _id: string;
  status: string;
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

export default function AppointmentHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      setLoading(true);
      setError("");
      try {
        const data = await getMyAppointmentHistory(user._id);
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setError("Không tải được lịch sử lịch hẹn");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?._id]);

  return (
    <div className="container mx-auto px-4 py-8 min-h-[60vh]">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Lịch sử lịch hẹn
      </h1>

      {loading && <div className="text-gray-600">Đang tải...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="text-gray-600">Chưa có lịch sử lịch hẹn.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const dateLabel = item.scheduleId?.date
            ? new Date(item.scheduleId.date).toLocaleDateString()
            : new Date(item.updatedAt).toLocaleDateString();
          return (
            <div
              key={item._id}
              className="bg-white rounded-lg shadow p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{dateLabel}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    item.status === "done"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.status === "done" ? "Hoàn thành" : "Đã hủy"}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-gray-900 font-medium">
                  {item.doctorId?.name || "Bác sĩ"}
                </div>
                <div className="text-sm text-gray-600">
                  {item.doctorId?.specialty}
                  {item.doctorId?.workplace
                    ? ` • ${item.doctorId.workplace}`
                    : ""}
                </div>
              </div>
              {item.symptoms && (
                <div className="mt-3 text-sm text-gray-700">
                  <span className="font-medium">Triệu chứng: </span>
                  {item.symptoms}
                </div>
              )}
              {item.scheduleId?.startTime && item.scheduleId?.endTime && (
                <div className="mt-2 text-sm text-gray-700">
                  Khung giờ: {item.scheduleId.startTime} -{" "}
                  {item.scheduleId.endTime}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
