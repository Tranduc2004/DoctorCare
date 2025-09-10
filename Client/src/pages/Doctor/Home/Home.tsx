import {
  Users,
  FileText,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { specialtyApi } from "../../../api/specialtyApi";

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  // Fetch specialties to get specialty names
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const data = await specialtyApi.getActiveSpecialties();
        setSpecialties(data || []);
      } catch (error) {
        console.error("Error loading specialties:", error);
      }
    };
    loadSpecialties();
  }, []);

  // Get specialty name by ID
  const getSpecialtyName = (specialtyId: string) => {
    const specialty = specialties.find((s) => s._id === specialtyId);
    return specialty ? specialty.name : "Không xác định";
  };

  const stats = [
    {
      title: "Bệnh nhân hôm nay",
      value: "24",
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      title: "Cuộc hẹn đã xác nhận",
      value: "18",
      icon: CheckCircle,
      color: "bg-green-500",
      change: "+8%",
    },
    {
      title: "Đang chờ khám",
      value: "6",
      icon: Clock,
      color: "bg-orange-500",
      change: "-5%",
    },
    {
      title: "Khẩn cấp",
      value: "2",
      icon: AlertCircle,
      color: "bg-red-500",
      change: "+2",
    },
  ];

  const upcomingAppointments = [
    {
      id: 1,
      patient: "Nguyễn Văn An",
      time: "09:00",
      type: "Khám tổng quát",
      status: "confirmed",
    },
    {
      id: 2,
      patient: "Trần Thị Bình",
      time: "09:30",
      type: "Tái khám",
      status: "waiting",
    },
    {
      id: 3,
      patient: "Lê Văn Cường",
      time: "10:00",
      type: "Khám chuyên khoa",
      status: "confirmed",
    },
    {
      id: 4,
      patient: "Phạm Thị Dung",
      time: "10:30",
      type: "Tư vấn online",
      status: "pending",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "Hoàn thành khám bệnh",
      patient: "Nguyễn Văn Nam",
      time: "30 phút trước",
      type: "completed",
    },
    {
      id: 2,
      action: "Cập nhật hồ sơ bệnh án",
      patient: "Trần Thị Mai",
      time: "1 giờ trước",
      type: "updated",
    },
    {
      id: 3,
      action: "Xác nhận cuộc hẹn",
      patient: "Lê Văn Hùng",
      time: "2 giờ trước",
      type: "confirmed",
    },
  ];

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {user?.name?.[0] || "B"}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">
                Chào mừng trở lại, BS. {user?.name}
              </h2>
              <p className="text-blue-100">
                Chuyên khoa: {getSpecialtyName(user?.specialty || "")} •{" "}
                {user?.workplace || "Chưa cập nhật"}
              </p>
            </div>
            <div className="ml-auto flex space-x-3">
              <button
                className="bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                onClick={() => navigate("/doctor/appointments")}
              >
                Bắt đầu khám bệnh
              </button>
              <button
                className="border border-white text-white px-5 py-2 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                onClick={() => navigate("/doctor/schedule")}
              >
                Xem ca làm việc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p
                  className={`text-sm mt-2 ${
                    stat.change.startsWith("+")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stat.change} so với hôm qua
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Lịch hẹn hôm nay
                </h3>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Xem tất cả
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {appointment.patient}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {appointment.time}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "waiting"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {appointment.status === "confirmed"
                          ? "Đã xác nhận"
                          : appointment.status === "waiting"
                          ? "Đang chờ"
                          : "Chờ xác nhận"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activities */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Thao tác nhanh
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Plus className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-blue-600">
                    Tạo hồ sơ mới
                  </span>
                </button>
                <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <Eye className="h-6 w-6 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-600">
                    Xem bệnh án
                  </span>
                </button>
                <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <FileText className="h-6 w-6 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-purple-600">
                    Đặt lịch hẹn
                  </span>
                </button>
                <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <FileText className="h-6 w-6 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-orange-600">
                    Viết đơn thuốc
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Hoạt động gần đây
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div
                      className={`mt-1 h-2 w-2 rounded-full ${
                        activity.type === "completed"
                          ? "bg-green-500"
                          : activity.type === "updated"
                          ? "bg-blue-500"
                          : "bg-orange-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.patient}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
