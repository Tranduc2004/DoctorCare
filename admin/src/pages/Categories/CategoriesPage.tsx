import React, { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Search,
  Clock,
  User,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Users,
  Package,
  Edit3,
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import "../../styles/categories.css";

interface MedicineCategory {
  _id: string;
  name: string;
  description?: string;
  code: string;
  isActive: boolean;
  status: "pending" | "approved" | "rejected";
  createdBy: string;
  createdByName: string;
  createdByRole: "admin" | "staff";
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryStats {
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
}

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

const CategoriesPage: React.FC = () => {
  const { token, admin } = useAdminAuth();
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<MedicineCategory | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch categories
  const fetchCategories = async () => {
    try {
      if (!token) {
        console.log("No token available");
        return;
      }

      console.log("Token being used:", token.substring(0, 20) + "...");

      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { createdByRole: roleFilter }),
      });

      const response = await fetch(
        `http://localhost:5000/api/admin/categories?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data.categories);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        const errorData = await response.text();
        console.error(
          "Failed to fetch categories:",
          response.status,
          errorData
        );
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/admin/categories/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    console.log("Admin:", admin);
    console.log("Token available:", !!token);
    if (token) {
      fetchCategories();
      fetchStats();
    }
  }, [currentPage, searchTerm, statusFilter, roleFilter, token]);

  // Approve category
  const handleApprove = async (categoryId: string) => {
    try {
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/admin/categories/${categoryId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        fetchCategories();
        fetchStats();
      } else {
        console.error("Failed to approve category");
      }
    } catch (error) {
      console.error("Error approving category:", error);
    }
  };

  // Reject category
  const handleReject = async () => {
    if (!selectedCategory || !rejectReason.trim() || !token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/categories/${selectedCategory._id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );

      if (response.ok) {
        fetchCategories();
        fetchStats();
        setShowRejectModal(false);
        setRejectReason("");
        setSelectedCategory(null);
      } else {
        console.error("Failed to reject category");
      }
    } catch (error) {
      console.error("Error rejecting category:", error);
    }
  };

  // Delete category
  const handleDelete = async (categoryId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?") || !token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        fetchCategories();
        fetchStats();
      } else {
        console.error("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Quản lý danh mục thuốc
              </h1>
              <p className="text-gray-600 text-lg">
                Quản lý các danh mục thuốc được tạo bởi admin và nhân viên nhà
                thuốc
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Thêm danh mục mới
              </button>
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
                    Tổng danh mục
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 counter-animation">
                    {stats.total}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      +12% từ tháng trước
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <Package className="w-8 h-8 text-blue-600" />
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
                    {stats.byStatus.pending || 0}
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
                    {stats.byStatus.approved || 0}
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
                    Từ nhân viên
                  </p>
                  <p className="text-3xl font-bold text-purple-600 mt-2 counter-animation">
                    {stats.byRole.staff || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <Users className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600 font-medium">
                      Đóng góp
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <Users className="w-8 h-8 text-purple-600" />
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
                  placeholder="Tìm kiếm theo tên danh mục, mã hoặc người tạo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all min-w-[150px]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">⏳ Chờ duyệt</option>
                <option value="approved">✅ Đã duyệt</option>
                <option value="rejected">❌ Từ chối</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all min-w-[150px]"
              >
                <option value="">Tất cả vai trò</option>
                <option value="admin">👑 Admin</option>
                <option value="staff">👨‍⚕️ Nhân viên</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modern Categories Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Thông tin danh mục
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Mã danh mục
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Người tạo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-500 font-medium">
                          Đang tải dữ liệu...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium text-lg">
                          Không có danh mục nào
                        </p>
                        <p className="text-gray-400 mt-1">
                          Hãy thêm danh mục đầu tiên của bạn
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => (
                    <tr
                      key={category._id}
                      className="hover:bg-gray-50 transition-color"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">
                                {(currentPage - 1) * 10 + index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {category.name}
                            </p>
                            {category.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                          {category.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={category.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                category.createdByRole === "admin"
                                  ? "bg-blue-100"
                                  : "bg-purple-100"
                              }`}
                            >
                              <User
                                className={`w-4 h-4 ${
                                  category.createdByRole === "admin"
                                    ? "text-blue-600"
                                    : "text-purple-600"
                                }`}
                              />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {category.createdByName}
                            </p>
                            <RoleBadge role={category.createdByRole} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(category.createdAt).toLocaleDateString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(category.createdAt).toLocaleTimeString(
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
                          {/* Nút sửa - luôn hiển thị */}
                          <button
                            onClick={() => {
                              setSelectedCategory(category);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                            title="Sửa danh mục"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>

                          {category.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(category._id)}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                title="Duyệt danh mục"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setShowRejectModal(true);
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                title="Từ chối danh mục"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa danh mục"
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

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700">
                    Hiển thị{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * 10 + 1}
                    </span>{" "}
                    -
                    <span className="font-medium">
                      {Math.min(currentPage * 10, stats?.total || 0)}
                    </span>
                    trong tổng số{" "}
                    <span className="font-medium">{stats?.total || 0}</span>{" "}
                    danh mục
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Trang trước
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white shadow-lg"
                              : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Từ chối danh mục
              </h3>
            </div>

            <p className="text-gray-600 mb-4 leading-relaxed">
              Bạn đang từ chối danh mục{" "}
              <span className="font-semibold text-gray-900">
                "{selectedCategory?.name}"
              </span>
              . Vui lòng nhập lý do để nhân viên có thể hiểu và cải thiện:
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Tên danh mục không rõ ràng, trùng lặp với danh mục hiện có..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                Xác nhận từ chối
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setSelectedCategory(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <EditCategoryModal
          category={selectedCategory}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          onSuccess={() => {
            fetchCategories();
            fetchStats();
          }}
          token={token}
        />
      )}

      {/* Enhanced Create Category Modal */}
      {showCreateModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchCategories();
            fetchStats();
          }}
          token={token}
        />
      )}
    </div>
  );
};

// Enhanced Edit Category Modal Component
const EditCategoryModal: React.FC<{
  category: MedicineCategory;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
}> = ({ category, onClose, onSuccess, token }) => {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || "",
    code: category.code,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !token) return;

    try {
      setLoading(true);
      console.log(
        "Updating category with token:",
        token ? "Token available" : "No token"
      );
      console.log("Form data:", formData);

      const response = await fetch(
        `http://localhost:5000/api/admin/categories/${category._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      console.log("Update response status:", response.status);

      if (response.ok) {
        console.log("Category updated successfully");
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        console.error("Update category error:", error);
        alert(error.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Edit3 className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Sửa danh mục</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ví dụ: Thuốc giảm đau, Kháng sinh..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mã danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
              placeholder="Ví dụ: PAINRELIEF, ANTIBIOTIC..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Mã sẽ được tự động chuyển thành chữ hoa
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="Mô tả chi tiết về danh mục thuốc này..."
            />
          </div>

          {/* Hiển thị thông tin trạng thái */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Thông tin danh mục
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <StatusBadge status={category.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Người tạo:</span>
                <span className="font-medium">{category.createdByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tạo:</span>
                <span>
                  {new Date(category.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={
                loading || !formData.name.trim() || !formData.code.trim()
              }
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-5" />
                  Cập nhật danh mục
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Create Category Modal Component
const CreateCategoryModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
}> = ({ onClose, onSuccess, token }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !token) return;

    try {
      setLoading(true);
      console.log(
        "Creating category with token:",
        token ? "Token available" : "No token"
      );
      console.log("Form data:", formData);

      const response = await fetch(
        "http://localhost:5000/api/admin/categories",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      console.log("Create response status:", response.status);

      if (response.ok) {
        console.log("Category created successfully");
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        console.error("Create category error:", error);
        alert(error.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Thêm danh mục mới</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ví dụ: Thuốc giảm đau, Kháng sinh..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mã danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
              placeholder="Ví dụ: PAINRELIEF, ANTIBIOTIC..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Mã sẽ được tự động chuyển thành chữ hoa
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="Mô tả chi tiết về danh mục thuốc này..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={
                loading || !formData.name.trim() || !formData.code.trim()
              }
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Tạo danh mục
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriesPage;
