import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import {
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const Dashboard = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  // Đăng xuất dùng ở nơi khác nếu cần
  // Sidebar đã được cung cấp bởi AdminLayout

  const stats = [
    {
      title: "Tổng bệnh nhân",
      value: "1,234",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      trend: "up",
    },
    {
      title: "Tổng bác sĩ",
      value: "56",
      icon: UserCheck,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      change: "+3%",
      trend: "up",
    },
    {
      title: "Lịch hẹn hôm nay",
      value: "89",
      icon: Calendar,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      change: "+8%",
      trend: "up",
    },
    {
      title: "Chờ xử lý",
      value: "23",
      icon: Clock,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      change: "-5%",
      trend: "down",
    },
  ];

  const quickActions = [
    {
      title: "Thêm bệnh nhân mới",
      description: "Đăng ký thông tin bệnh nhân",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      action: () => navigate("/patients/new"),
    },
    {
      title: "Tạo lịch hẹn",
      description: "Đặt lịch khám cho bệnh nhân",
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
      action: () => navigate("/appointments/new"),
    },
    {
      title: "Quản lý bác sĩ",
      description: "Thêm hoặc chỉnh sửa thông tin bác sĩ",
      icon: UserCheck,
      color: "from-green-500 to-green-600",
      action: () => navigate("/doctors"),
    },
    {
      title: "Xem báo cáo",
      description: "Thống kê và phân tích dữ liệu",
      icon: BarChart3,
      color: "from-orange-500 to-orange-600",
      action: () => navigate("/reports"),
    },
  ];

  const recentActivities = [
    {
      icon: CheckCircle,
      title: "Lịch hẹn hoàn thành",
      description: "Bệnh nhân Nguyễn Văn A đã hoàn thành khám",
      time: "2 phút trước",
      color: "text-green-600 bg-green-100",
    },
    {
      icon: UserCheck,
      title: "Bác sĩ mới",
      description: "Dr. Trần Thị B đã tham gia hệ thống",
      time: "15 phút trước",
      color: "text-blue-600 bg-blue-100",
    },
    {
      icon: Activity,
      title: "Cập nhật hồ sơ",
      description: "Hồ sơ BN001 đã được cập nhật kết quả",
      time: "1 giờ trước",
      color: "text-amber-600 bg-amber-100",
    },
    {
      icon: AlertCircle,
      title: "Cảnh báo",
      description: "15 lịch hẹn cần xác nhận cho ngày mai",
      time: "2 giờ trước",
      color: "text-red-600 bg-red-100",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Chào mừng trở lại,{" "}
          <span className="font-semibold text-blue-600">{admin?.username}</span>
          !
        </p>
      </div>
      <div>
        <main className="flex-1 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div
                      className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        stat.trend === "up"
                          ? "text-green-700 bg-green-100"
                          : "text-red-700 bg-red-100"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Thao tác nhanh
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div
                    key={index}
                    className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={action.action}
                  >
                    <div
                      className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${action.color} mb-4 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {action.description}
                    </p>
                    <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span>Thực hiện</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Hoạt động gần đây
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={index}
                      className="p-6 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full ${activity.color}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {activity.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {activity.description}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {activity.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">
                  Xem tất cả hoạt động
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
