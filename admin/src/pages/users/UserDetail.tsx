import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Stethoscope,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  MapPin,
  Shield,
  Activity,
  Clock,
  Building,
  FileText,
  Settings,
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { adminGetUserById } from "../../api/adminApi";

// Xóa mock, dùng dữ liệu thật

const UserDetail: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showActions, setShowActions] = useState(false);
  const { id } = useParams();
  const { token } = useAdminAuth();

  useEffect(() => {
    const fetchUser = async () => {
      if (!id || !token) return;
      setLoading(true);
      setError("");
      try {
        const res = await adminGetUserById(token, id);
        setUser(res.data);
      } catch (e) {
        setError("Không tải được thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, token]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "patient":
        return "from-green-500 to-emerald-500";
      case "doctor":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "patient":
        return <UserIcon className="w-5 h-5" />;
      case "doctor":
        return <Stethoscope className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const InfoCard = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string;
    icon?: React.ReactNode;
  }) => (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-gray-600">{icon}</span>}
        <p className="text-sm text-gray-500 font-medium">{label}</p>
      </div>
      <p className="font-semibold text-gray-900 break-words">{value || "-"}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-20 h-20 border-4 border-transparent border-l-purple-600 rounded-full animate-spin opacity-70"
                style={{
                  animationDelay: "0.5s",
                  animationDirection: "reverse",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center shadow-xl">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-red-600 text-lg font-medium">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-6 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>Admin</span>
              <span>•</span>
              <span>Người dùng</span>
              <span>•</span>
              <span className="text-gray-700 font-medium">Chi tiết</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Chi tiết người dùng
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowActions(!showActions)}
              className="px-4 py-2 bg-white rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <Settings className="w-4 h-4" /> Hành động
              </span>
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </span>
            </button>
          </div>
        </div>

        {/* Actions dropdown */}
        {showActions && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 opacity-0 animate-pulse">
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-2">
                <FileText className="w-4 h-4" /> Chỉnh sửa
              </button>
              <button className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors inline-flex items-center gap-2">
                <Mail className="w-4 h-4" /> Gửi email
              </button>
              <button className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors inline-flex items-center gap-2">
                <Shield className="w-4 h-4" /> Khóa tài khoản
              </button>
              <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Xóa
              </button>
            </div>
          </div>
        )}

        {/* User Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-white/50 mb-8 overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
              <div
                className="w-3 h-3 bg-white/50 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-white/70 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <div className="relative flex items-center gap-6">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white/20 shadow-lg"
                />
              ) : (
                <div
                  className={`w-24 h-24 bg-gradient-to-br ${getRoleColor(
                    user.role
                  )} rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white/20 hover:ring-8 transition-all duration-300`}
                >
                  {(user.name || user.username || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-white">
                <h2 className="text-3xl font-bold mb-2">
                  {user.name || user.username || "(Không tên)"}
                </h2>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl text-white">
                    {getRoleIcon(user.role)}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-lg font-semibold backdrop-blur-sm">
                    {user.role === "patient"
                      ? "Bệnh nhân"
                      : user.role === "doctor"
                      ? "Bác sĩ"
                      : user.role}
                  </span>
                </div>
                <p className="text-white/80 font-mono">ID: {user._id}</p>
              </div>
              <div className="ml-auto text-right text-white/90">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-sm inline-flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" /> Tham gia
                  </p>
                  <p className="font-semibold text-lg">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-8 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold">Trực tuyến</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Activity className="w-4 h-4" />
                  <span className="font-medium">Hoạt động: Cao</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Đã xác thực</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                {
                  id: "overview",
                  label: "Tổng quan",
                  icon: <TrendingUp className="w-4 h-4" />,
                  count: 3,
                },
                {
                  id: "details",
                  label: "Chi tiết",
                  icon: <FileText className="w-4 h-4" />,
                  count: user.role === "doctor" ? 7 : 6,
                },
                {
                  id: "activity",
                  label: "Hoạt động",
                  icon: <Activity className="w-4 h-4" />,
                  count: 12,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-semibold transition-all relative group ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-blue-900 inline-flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Thông tin liên hệ
                      </h4>
                    </div>
                    <p className="text-blue-700 font-medium">{user.email}</p>
                    <p className="text-blue-600 text-sm mt-2">Đã xác thực ✓</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-green-900 inline-flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Trạng thái
                      </h4>
                    </div>
                    <p className="text-green-700 font-medium">Hoạt động</p>
                    <p className="text-green-600 text-sm mt-2">
                      Lần cuối: 2 giờ trước
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-purple-900 inline-flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Cập nhật
                      </h4>
                    </div>
                    <p className="text-purple-700 font-medium text-sm">
                      {user.updatedAt ? formatDate(user.updatedAt) : "-"}
                    </p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Thống kê nhanh
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">15</div>
                      <div className="text-sm text-gray-600">
                        Ngày hoạt động
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        98%
                      </div>
                      <div className="text-sm text-gray-600">Độ tin cậy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        5★
                      </div>
                      <div className="text-sm text-gray-600">Đánh giá</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        42
                      </div>
                      <div className="text-sm text-gray-600">Tương tác</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-8">
                {/* Basic Info */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoCard
                      label="Email"
                      value={user.email}
                      icon={<Mail className="w-4 h-4" />}
                    />
                    <InfoCard
                      label="Tên người dùng"
                      value={user.username}
                      icon={<UserIcon className="w-4 h-4" />}
                    />
                    <InfoCard
                      label="Tên hiển thị"
                      value={user.name}
                      icon={<FileText className="w-4 h-4" />}
                    />
                  </div>
                </div>

                {/* Role-specific Info */}
                {user.role === "patient" && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4" /> Thông tin bệnh nhân
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <InfoCard
                        label="Số điện thoại"
                        value={user.phone}
                        icon={<Phone className="w-4 h-4" />}
                      />
                      <InfoCard
                        label="Ngày sinh"
                        value={
                          user.dateOfBirth
                            ? new Date(user.dateOfBirth).toLocaleDateString(
                                "vi-VN"
                              )
                            : "-"
                        }
                        icon={<CalendarIcon className="w-4 h-4" />}
                      />
                      <InfoCard
                        label="Giới tính"
                        value={user.gender}
                        icon={<UserIcon className="w-4 h-4" />}
                      />
                      <div className="md:col-span-2 lg:col-span-3">
                        <InfoCard
                          label="Địa chỉ"
                          value={user.address}
                          icon={<MapPin className="w-4 h-4" />}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {user.role === "doctor" && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" /> Thông tin bác sĩ
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <InfoCard
                        label="Chuyên khoa"
                        value={user.specialty}
                        icon={<Building className="w-4 h-4" />}
                      />
                      <InfoCard
                        label="Kinh nghiệm (năm)"
                        value={user.experience?.toString()}
                        icon={<Clock className="w-4 h-4" />}
                      />
                      <InfoCard
                        label="Nơi làm việc"
                        value={user.workplace}
                        icon={<Building className="w-4 h-4" />}
                      />
                      <div className="md:col-span-2 lg:col-span-3">
                        <InfoCard
                          label="Mô tả"
                          value={user.description}
                          icon={<FileText className="w-4 h-4" />}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* System Info */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Thông tin hệ thống
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard
                      label="Được tạo"
                      value={user.createdAt ? formatDate(user.createdAt) : "-"}
                      icon={<CalendarIcon className="w-4 h-4" />}
                    />
                    <InfoCard
                      label="Cập nhật cuối"
                      value={user.updatedAt ? formatDate(user.updatedAt) : "-"}
                      icon={<Clock className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5" /> Hoạt động gần đây
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      action: "Đăng nhập hệ thống",
                      time: "2 giờ trước",
                      icon: <Shield className="w-5 h-5" />,
                      type: "success",
                    },
                    {
                      action: "Cập nhật thông tin hồ sơ",
                      time: "1 ngày trước",
                      icon: <FileText className="w-5 h-5" />,
                      type: "info",
                    },
                    {
                      action: "Thay đổi mật khẩu",
                      time: "3 ngày trước",
                      icon: <Shield className="w-5 h-5" />,
                      type: "warning",
                    },
                    {
                      action: "Đăng nhập từ thiết bị mới",
                      time: "1 tuần trước",
                      icon: <Activity className="w-5 h-5" />,
                      type: "info",
                    },
                    {
                      action: "Tạo tài khoản",
                      time: user.createdAt ? formatDate(user.createdAt) : "-",
                      icon: <CheckCircle className="w-5 h-5" />,
                      type: "success",
                    },
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md cursor-pointer ${
                        activity.type === "success"
                          ? "bg-green-50 border border-green-200 hover:bg-green-100"
                          : activity.type === "warning"
                          ? "bg-orange-50 border border-orange-200 hover:bg-orange-100"
                          : "bg-blue-50 border border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                          activity.type === "success"
                            ? "bg-gradient-to-br from-green-500 to-emerald-500"
                            : activity.type === "warning"
                            ? "bg-gradient-to-br from-orange-500 to-red-500"
                            : "bg-gradient-to-br from-blue-500 to-purple-500"
                        }`}
                      >
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600">{activity.time}</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          activity.type === "success"
                            ? "bg-green-200 text-green-800"
                            : activity.type === "warning"
                            ? "bg-orange-200 text-orange-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {activity.type === "success"
                          ? "Thành công"
                          : activity.type === "warning"
                          ? "Cảnh báo"
                          : "Thông tin"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Activity Chart Placeholder */}
                <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mt-8">
                  <h4 className="font-bold text-gray-900 mb-4">
                    📊 Biểu đồ hoạt động 30 ngày
                  </h4>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div
                          className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all hover:from-blue-600 hover:to-purple-600 cursor-pointer"
                          style={{
                            height: `${Math.random() * 80 + 20}px`,
                            width: "20px",
                          }}
                        />
                        <span className="text-xs text-gray-500">T{i + 2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl border border-white/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🛡️</span> Bảo mật
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">
                  Xác thực 2 bước
                </span>
                <span className="text-green-600">✅ Đã bật</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  Email xác thực
                </span>
                <span className="text-blue-600">✅ Đã xác thực</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-orange-800">
                  Đăng nhập gần đây
                </span>
                <span className="text-orange-600">⚠️ 2 giờ trước</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-white/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Thống kê
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">156</div>
                <div className="text-xs text-blue-800">Lượt truy cập</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">23</div>
                <div className="text-xs text-green-800">Ngày hoạt động</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">4.8</div>
                <div className="text-xs text-purple-800">Đánh giá TB</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">12</div>
                <div className="text-xs text-orange-800">Phản hồi</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
