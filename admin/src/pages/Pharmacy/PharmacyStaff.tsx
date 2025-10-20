import { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Mail,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Trash2,
  AlertTriangle,
  Search,
  TrendingUp,
} from "lucide-react";

interface PharmacyStaff {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  active: boolean;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StaffStats {
  total: number;
  byStatus: {
    pending?: number;
    approved?: number;
    rejected?: number;
  };
  byRole: {
    admin?: number;
    staff?: number;
  };
  byActivity: {
    active?: number;
    inactive?: number;
  };
}

const PharmacyStaffManagement = () => {
  const [staffList, setStaffList] = useState<PharmacyStaff[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedStaff, setSelectedStaff] = useState<PharmacyStaff | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<
    | "activate"
    | "deactivate"
    | "promote"
    | "demote"
    | "delete"
    | "approve"
    | "reject"
    | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchPharmacyStaff();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/admin/pharmacy/staff/stats",
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPharmacyStaff = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem("adminToken");

      // Call main server API (which uses shared domain)
      const response = await axios.get(
        "http://localhost:5000/api/admin/pharmacy/staff",
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      // Handle API response format: {success: true, data: {staff: [], pagination: {}}}
      const responseData = response.data;
      if (
        responseData.success &&
        responseData.data &&
        Array.isArray(responseData.data.staff)
      ) {
        setStaffList(responseData.data.staff);
      } else if (Array.isArray(responseData)) {
        setStaffList(responseData);
      } else {
        console.error("Invalid response format:", responseData);
        setStaffList([]);
      }
    } catch (error) {
      console.error("Error fetching pharmacy staff:", error);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const filteredStaff = searchTerm
    ? Array.isArray(staffList)
      ? staffList.filter(
          (staff) =>
            staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : []
    : selectedStatus === "all"
    ? staffList
    : selectedStatus === "pending"
    ? Array.isArray(staffList)
      ? staffList.filter((staff) => staff.status === "pending")
      : []
    : selectedStatus === "approved"
    ? Array.isArray(staffList)
      ? staffList.filter((staff) => staff.status === "approved")
      : []
    : selectedStatus === "rejected"
    ? Array.isArray(staffList)
      ? staffList.filter((staff) => staff.status === "rejected")
      : []
    : selectedStatus === "active"
    ? Array.isArray(staffList)
      ? staffList.filter((staff) => staff.active)
      : []
    : Array.isArray(staffList)
    ? staffList.filter((staff) => !staff.active)
    : [];

  const handleApprove = async (staffId: string) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:5000/api/admin/pharmacy/staff/${staffId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      fetchPharmacyStaff(); // Refresh list
      fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error("Error approving staff:", error);
      alert("Có lỗi xảy ra khi duyệt nhân viên");
    }
  };

  const handleReject = async (staffId: string, reason: string) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:5000/api/admin/pharmacy/staff/${staffId}/reject`,
        {
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      fetchPharmacyStaff(); // Refresh list
      fetchStats();
      setShowModal(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting staff:", error);
      alert("Có lỗi xảy ra khi từ chối nhân viên");
    }
  };

  const handleToggleActive = async (staffId: string, active: boolean) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:5000/api/admin/pharmacy/staff/${staffId}/status`,
        { active },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      fetchPharmacyStaff(); // Refresh list
      fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error("Error updating staff status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái nhân viên");
    }
  };

  const handleChangeRole = async (staffId: string, role: "admin" | "staff") => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:5000/api/admin/pharmacy/staff/${staffId}/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      fetchPharmacyStaff(); // Refresh list
      fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error("Error updating staff role:", error);
      alert("Có lỗi xảy ra khi cập nhật vai trò nhân viên");
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      await axios.delete(
        `http://localhost:5000/api/admin/pharmacy/staff/${staffId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      fetchPharmacyStaff(); // Refresh list
      fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Có lỗi xảy ra khi xóa nhân viên");
    }
  };

  const openModal = (
    staff: PharmacyStaff,
    action:
      | "activate"
      | "deactivate"
      | "promote"
      | "demote"
      | "delete"
      | "approve"
      | "reject"
  ) => {
    setSelectedStaff(staff);
    setModalAction(action);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
    setModalAction(null);
    setRejectionReason("");
  };

  const confirmAction = () => {
    if (!selectedStaff) return;

    switch (modalAction) {
      case "activate":
        handleToggleActive(selectedStaff._id, true);
        break;
      case "deactivate":
        handleToggleActive(selectedStaff._id, false);
        break;
      case "promote":
        handleChangeRole(selectedStaff._id, "admin");
        break;
      case "demote":
        handleChangeRole(selectedStaff._id, "staff");
        break;
      case "delete":
        handleDeleteStaff(selectedStaff._id);
        break;
      case "approve":
        handleApprove(selectedStaff._id);
        break;
      case "reject":
        if (!rejectionReason.trim()) {
          alert("Vui lòng nhập lý do từ chối");
          return;
        }
        handleReject(selectedStaff._id, rejectionReason);
        break;
    }
  };

  // Enhanced Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      pending: {
        color:
          "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200",
        icon: Clock,
        text: "Chờ duyệt",
        pulse: "animate-pulse",
      },
      approved: {
        color:
          "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200",
        icon: CheckCircle,
        text: "Đã duyệt",
        pulse: "",
      },
      rejected: {
        color:
          "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200",
        icon: XCircle,
        text: "Từ chối",
        pulse: "",
      },
    };

    const {
      color,
      icon: Icon,
      text,
      pulse,
    } = config[status as keyof typeof config] || config.pending;

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${color} ${pulse}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {text}
      </span>
    );
  };

  // Enhanced Role badge component
  const RoleBadge = ({ role }: { role: string }) => {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
          role === "admin"
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-purple-50 text-purple-700 border border-purple-200"
        }`}
      >
        <User className="w-3 h-3" />
        {role === "admin" ? "👑 Admin" : "👨‍⚕️ Nhân viên"}
      </span>
    );
  };

  // Activity badge component
  const ActivityBadge = ({ active }: { active: boolean }) => {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
          active
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-gray-50 text-gray-700 border border-gray-200"
        }`}
      >
        {active ? (
          <UserCheck className="w-3 h-3" />
        ) : (
          <UserX className="w-3 h-3" />
        )}
        {active ? "Hoạt động" : "Tạm dừng"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Quản lý nhân viên Nhà thuốc
              </h1>
              <p className="text-gray-600 text-lg">
                Duyệt và quản lý tài khoản nhân viên nhà thuốc trong hệ thống
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stats-grid">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Tổng nhân viên
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 counter-animation">
                    {stats?.total || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      +8% từ tháng trước
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Chờ duyệt
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2 counter-animation">
                    {stats?.byStatus?.pending || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-yellow-600 font-medium">
                      Cần xử lý
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Đã duyệt
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2 counter-animation">
                    {stats?.byStatus?.approved || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      Hoạt động
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Hoạt động
                  </p>
                  <p className="text-3xl font-bold text-purple-600 mt-2 counter-animation">
                    {stats?.byActivity?.active || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <UserCheck className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600 font-medium">
                      Đang làm việc
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <UserCheck className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên nhân viên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleStatusChange("all")}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  selectedStatus === "all"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Tất cả ({Array.isArray(staffList) ? staffList.length : 0})
              </button>
              <button
                onClick={() => handleStatusChange("pending")}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  selectedStatus === "pending"
                    ? "bg-yellow-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                ⏳ Chờ duyệt (
                {Array.isArray(staffList)
                  ? staffList.filter((s) => s.status === "pending").length
                  : 0}
                )
              </button>
              <button
                onClick={() => handleStatusChange("approved")}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  selectedStatus === "approved"
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                ✅ Đã duyệt (
                {Array.isArray(staffList)
                  ? staffList.filter((s) => s.status === "approved").length
                  : 0}
                )
              </button>
              <button
                onClick={() => handleStatusChange("rejected")}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  selectedStatus === "rejected"
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                ❌ Đã từ chối (
                {Array.isArray(staffList)
                  ? staffList.filter((s) => s.status === "rejected").length
                  : 0}
                )
              </button>
            </div>
          </div>
        </div>

        {/* Modern Staff Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Thông tin nhân viên
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Hoạt động
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium text-lg">
                          Không có nhân viên nào
                        </p>
                        <p className="text-gray-400 mt-1">
                          Chưa có nhân viên nào phù hợp với bộ lọc
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr
                      key={staff._id}
                      className="hover:bg-gray-50 transition-colors table-row-hover"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {staff.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {staff.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {staff._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {staff.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={staff.role} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={staff.status} />
                        {staff.status === "rejected" &&
                          staff.rejectedReason && (
                            <div className="text-xs text-red-600 mt-1 max-w-32 truncate">
                              Lý do: {staff.rejectedReason}
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4">
                        <ActivityBadge active={staff.active} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(staff.createdAt).toLocaleDateString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(staff.createdAt).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Approve/Reject for pending staff */}
                          {staff.status === "pending" && (
                            <>
                              <button
                                onClick={() => openModal(staff, "approve")}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                title="Duyệt nhân viên"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openModal(staff, "reject")}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                title="Từ chối nhân viên"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}

                          {/* Actions for approved staff */}
                          {staff.status === "approved" && (
                            <>
                              {/* Toggle Active/Inactive */}
                              <button
                                onClick={() =>
                                  openModal(
                                    staff,
                                    staff.active ? "deactivate" : "activate"
                                  )
                                }
                                className={`p-2 rounded-lg transition-all ${
                                  staff.active
                                    ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                }`}
                                title={
                                  staff.active ? "Vô hiệu hóa" : "Kích hoạt"
                                }
                              >
                                {staff.active ? (
                                  <UserX className="w-5 h-5" />
                                ) : (
                                  <UserCheck className="w-5 h-5" />
                                )}
                              </button>

                              {/* Change Role */}
                              <button
                                onClick={() =>
                                  openModal(
                                    staff,
                                    staff.role === "admin"
                                      ? "demote"
                                      : "promote"
                                  )
                                }
                                className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                                title={
                                  staff.role === "admin"
                                    ? "Giáng cấp"
                                    : "Thăng cấp"
                                }
                              >
                                {staff.role === "admin" ? (
                                  <UserMinus className="w-5 h-5" />
                                ) : (
                                  <UserPlus className="w-5 h-5" />
                                )}
                              </button>
                            </>
                          )}

                          {/* Delete (available for all) */}
                          <button
                            onClick={() => openModal(staff, "delete")}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa nhân viên"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced Confirmation Modal */}
      {showModal && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`p-2 rounded-xl ${
                  modalAction === "delete" || modalAction === "reject"
                    ? "bg-red-100"
                    : modalAction === "deactivate"
                    ? "bg-orange-100"
                    : "bg-blue-100"
                }`}
              >
                {modalAction === "delete" ? (
                  <Trash2 className="w-6 h-6 text-red-600" />
                ) : modalAction === "reject" ? (
                  <XCircle className="w-6 h-6 text-red-600" />
                ) : modalAction === "approve" ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : modalAction === "activate" ? (
                  <UserCheck className="w-6 h-6 text-green-600" />
                ) : modalAction === "deactivate" ? (
                  <UserX className="w-6 h-6 text-orange-600" />
                ) : modalAction === "promote" ? (
                  <UserPlus className="w-6 h-6 text-purple-600" />
                ) : modalAction === "demote" ? (
                  <UserMinus className="w-6 h-6 text-purple-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {modalAction === "activate" && "Xác nhận kích hoạt"}
                {modalAction === "deactivate" && "Xác nhận vô hiệu hóa"}
                {modalAction === "promote" && "Xác nhận thăng cấp"}
                {modalAction === "demote" && "Xác nhận giáng cấp"}
                {modalAction === "delete" && "Xác nhận xóa"}
                {modalAction === "approve" && "Xác nhận duyệt"}
                {modalAction === "reject" && "Xác nhận từ chối"}
              </h3>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedStaff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedStaff.name}
                  </p>
                  <p className="text-sm text-gray-600">{selectedStaff.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Vai trò:</span>
                  <RoleBadge role={selectedStaff.role} />
                </div>
                <div>
                  <span className="text-gray-500">Trạng thái:</span>
                  <StatusBadge status={selectedStaff.status} />
                </div>
              </div>
            </div>

            {modalAction === "approve" && (
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn duyệt nhân viên này? Họ sẽ có thể đăng
                nhập vào hệ thống nhà thuốc và sử dụng các chức năng được phép.
              </p>
            )}

            {modalAction === "reject" && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  placeholder="Ví dụ: Thông tin không đầy đủ, không đáp ứng yêu cầu..."
                />
              </div>
            )}

            {modalAction === "activate" && (
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn kích hoạt nhân viên này? Họ sẽ có thể truy
                cập hệ thống trở lại.
              </p>
            )}

            {modalAction === "deactivate" && (
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn vô hiệu hóa nhân viên này? Họ sẽ không thể
                truy cập hệ thống cho đến khi được kích hoạt lại.
              </p>
            )}

            {modalAction === "promote" && (
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn thăng cấp nhân viên này lên quản trị viên?
                Họ sẽ có quyền quản lý cao hơn trong hệ thống.
              </p>
            )}

            {modalAction === "demote" && (
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn giáng cấp quản trị viên này xuống nhân
                viên? Quyền hạn của họ sẽ bị giới hạn.
              </p>
            )}

            {modalAction === "delete" && (
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống? Hành động
                này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị mất.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmAction}
                disabled={modalAction === "reject" && !rejectionReason.trim()}
                className={`flex-1 px-6 py-3 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  modalAction === "delete" || modalAction === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : modalAction === "deactivate"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {modalAction === "activate" && "Kích hoạt"}
                {modalAction === "deactivate" && "Vô hiệu hóa"}
                {modalAction === "promote" && "Thăng cấp"}
                {modalAction === "demote" && "Giáng cấp"}
                {modalAction === "delete" && "Xóa nhân viên"}
                {modalAction === "approve" && "Duyệt nhân viên"}
                {modalAction === "reject" && "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyStaffManagement;
