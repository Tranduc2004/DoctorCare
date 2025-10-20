import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Eye,
  Pill,
  ExternalLink,
  BarChart3,
  Package2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  categoryApi,
  type MedicineCategory,
  type CategoryStats,
  type CategoryDetailData,
} from "../../api/categoryApi";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  pharmacyId?: string;
}

// Enhanced Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    pending: {
      color:
        "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200",
      icon: Clock,
      text: "Chờ duyệt",
      pulse: "animate-pulse",
    },
    approved: {
      color:
        "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200",
      icon: CheckCircle,
      text: "Đã duyệt",
      pulse: "",
    },
    rejected: {
      color:
        "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200",
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

const Categories: React.FC = () => {
  const { user, token } = useAuth();
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<MedicineCategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = useCallback(async () => {
    try {
      if (!token) {
        console.log("No token available in fetchCategories");
        return;
      }

      console.log(
        "Fetching categories with token:",
        token.substring(0, 20) + "..."
      );
      setLoading(true);
      const result = await categoryApi.getCategories({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status:
          (statusFilter as "pending" | "approved" | "rejected") || undefined,
      });

      if (result.success) {
        console.log(
          "Categories fetched successfully:",
          result.data.categories.length
        );
        setCategories(result.data.categories);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        console.error("Failed to fetch categories:", result.error);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Check if it's an auth error
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          console.log("Authentication error when fetching categories");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, searchTerm, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      if (!token) {
        console.log("No token available in fetchStats");
        return;
      }

      console.log(
        "Fetching category stats with token:",
        token.substring(0, 20) + "..."
      );
      const result = await categoryApi.getCategoryStats();
      if (result.success) {
        console.log("Stats fetched successfully");
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [token]);

  useEffect(() => {
    console.log("Categories useEffect called with:", {
      token: token ? token.substring(0, 20) + "..." : null,
      user: user?.name,
    });

    if (token) {
      console.log("Token exists, fetching data...");
      fetchCategories();
      fetchStats();
    } else {
      console.log("No token, skipping data fetch");
    }
  }, [fetchCategories, fetchStats, token, user]);

  // Delete category
  const handleDelete = async (categoryId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?") || !token) return;

    try {
      const result = await categoryApi.deleteCategory(categoryId);
      if (result.success) {
        fetchCategories();
        fetchStats();
      } else {
        alert(result.error || "Không thể xóa danh mục");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Có lỗi xảy ra khi xóa danh mục");
    }
  };

  // Navigate to medicines by category
  const handleViewMedicines = (categoryId: string, categoryName: string) => {
    // Store category info in sessionStorage for the medicines page
    sessionStorage.setItem(
      "selectedCategory",
      JSON.stringify({
        id: categoryId,
        name: categoryName,
      })
    );
    // Navigate to medicines page with category filter
    window.location.href = `/medicines?categoryId=${categoryId}`;
  };

  return (
    <div className="min-h-screen">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                Quản lý danh mục thuốc
              </h1>
              <p className="text-slate-600 text-lg">
                Tạo và quản lý các danh mục thuốc trong nhà thuốc của bạn
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Thêm danh mục mới
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                      Tổng danh mục
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {stats.total}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-teal-500 mr-1" />
                      <span className="text-sm text-teal-600 font-medium">
                        Đang hoạt động
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-xl">
                    <Package className="w-8 h-8 text-teal-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                      Chờ duyệt
                    </p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">
                      {stats.pending}
                    </p>
                    <div className="flex items-center mt-2">
                      <Clock className="w-4 h-4 text-amber-500 mr-1" />
                      <span className="text-sm text-amber-600 font-medium">
                        Cần xử lý
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                      Đã duyệt
                    </p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">
                      {stats.approved}
                    </p>
                    <div className="flex items-center mt-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                      <span className="text-sm text-emerald-600 font-medium">
                        Hoạt động
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                      Của tôi
                    </p>
                    <p className="text-3xl font-bold text-cyan-600 mt-2">
                      {stats.myCategories}
                    </p>
                    <div className="flex items-center mt-2">
                      <User className="w-4 h-4 text-cyan-500 mr-1" />
                      <span className="text-sm text-cyan-600 font-medium">
                        Đóng góp
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-cyan-100 rounded-xl">
                    <User className="w-8 h-8 text-cyan-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Medicine Statistics Cards */}
            {stats.medicineStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                        Tổng thuốc
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {stats.medicineStats.totalMedicines}
                      </p>
                      <div className="flex items-center mt-2">
                        <Pill className="w-4 h-4 text-purple-500 mr-1" />
                        <span className="text-sm text-purple-600 font-medium">
                          Trong hệ thống
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Pill className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                        Thuốc của tôi
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {stats.medicineStats.myMedicines}
                      </p>
                      <div className="flex items-center mt-2">
                        <User className="w-4 h-4 text-indigo-500 mr-1" />
                        <span className="text-sm text-indigo-600 font-medium">
                          Đã tạo
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <User className="w-8 h-8 text-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-rose-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                        Danh mục có thuốc
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {stats.medicineStats.categoriesWithMedicines}
                      </p>
                      <div className="flex items-center mt-2">
                        <Package2 className="w-4 h-4 text-rose-500 mr-1" />
                        <span className="text-sm text-rose-600 font-medium">
                          {stats.medicineStats.emptyCategoriesCount} trống
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-rose-100 rounded-xl">
                      <Package2 className="w-8 h-8 text-rose-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Categories by Medicine Count */}
            {stats.medicineStats?.topCategoriesByMedicineCount &&
              stats.medicineStats.topCategoriesByMedicineCount.length > 0 && (
                <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-100 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Danh mục có nhiều thuốc nhất
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {stats.medicineStats.topCategoriesByMedicineCount.map(
                      (category, index) => (
                        <div
                          key={category.categoryId}
                          className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-teal-600 bg-teal-100 px-2 py-1 rounded-full">
                              #{index + 1}
                            </span>
                            <span className="text-lg font-bold text-teal-700">
                              {category.medicineCount}
                            </span>
                          </div>
                          <p
                            className="text-sm font-semibold text-slate-900 truncate"
                            title={category.categoryName}
                          >
                            {category.categoryName}
                          </p>
                          <p className="text-xs text-slate-600 font-mono">
                            {category.categoryCode}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </>
        )}

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên danh mục, mã hoặc người tạo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white/70 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 focus:bg-white transition-all min-w-[150px]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">⏳ Chờ duyệt</option>
                <option value="approved">✅ Đã duyệt</option>
                <option value="rejected">❌ Từ chối</option>
              </select>

              <button className="px-4 py-3 border border-slate-200 rounded-xl bg-white/70 hover:bg-white transition-all flex items-center gap-2 text-slate-600">
                <Filter className="w-4 h-4" />
                Bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-teal-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Thông tin danh mục
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Mã danh mục
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Thuốc
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Người tạo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                        <p className="text-slate-500 font-medium">
                          Đang tải dữ liệu...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="w-16 h-16 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium text-lg">
                          Chưa có danh mục nào
                        </p>
                        <p className="text-slate-400 mt-1">
                          Hãy tạo danh mục đầu tiên của bạn
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => (
                    <tr
                      key={category._id}
                      className="hover:bg-teal-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center">
                              <span className="text-teal-600 font-bold text-sm">
                                {(currentPage - 1) * 10 + index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {category.name}
                            </p>
                            {category.description && (
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border">
                          {category.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-semibold text-slate-900">
                                {category.medicineCount || 0} thuốc
                              </span>
                            </div>
                            {category.myMedicinesInCategory !== undefined &&
                              category.myMedicinesInCategory > 0 && (
                                <div className="flex items-center gap-2 mt-1">
                                  <User className="w-3 h-3 text-indigo-500" />
                                  <span className="text-xs text-indigo-600">
                                    {category.myMedicinesInCategory} của tôi
                                  </span>
                                </div>
                              )}
                          </div>
                          {(category.medicineCount || 0) > 0 && (
                            <button
                              onClick={() =>
                                handleViewMedicines(category._id, category.name)
                              }
                              className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                              title={`Xem ${category.medicineCount} thuốc trong danh mục ${category.name}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={category.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-teal-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {category.createdByName}
                            </p>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                              <User className="w-3 h-3" />
                              {category.createdByRole === "admin"
                                ? "👑 Admin"
                                : "👨‍⚕️ Nhân viên"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-slate-500">
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
                        <div className="text-xs text-slate-400 mt-1">
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
                          {/* View Details Button */}
                          <button
                            onClick={() => {
                              setSelectedCategory(category);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                            title="Xem chi tiết danh mục"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          {/* Chỉ hiển thị nút sửa/xóa nếu là người tạo hoặc là admin */}
                          {(category.createdBy === user?.id ||
                            user?.role === "admin") && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setShowEditModal(true);
                                }}
                                className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                                title="Sửa danh mục"
                              >
                                <Edit3 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(category._id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                title="Xóa danh mục"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {category.status === "rejected" &&
                            category.rejectedReason && (
                              <button
                                className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                                title={`Lý do từ chối: ${category.rejectedReason}`}
                              >
                                <AlertTriangle className="w-5 h-5" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-teal-50/50 border-t border-teal-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-slate-700">
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
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                              ? "bg-teal-600 text-white shadow-lg"
                              : "text-slate-600 bg-white border border-slate-300 hover:bg-slate-50"
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
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchCategories();
            fetchStats();
          }}
          token={token}
          user={user}
        />
      )}

      {/* Edit Category Modal */}
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
          user={user}
        />
      )}

      {/* Category Detail Modal */}
      {showDetailModal && selectedCategory && (
        <CategoryDetailModal
          category={selectedCategory}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCategory(null);
          }}
          onViewMedicines={handleViewMedicines}
          token={token}
        />
      )}
    </div>
  );
};

// Create Category Modal
const CreateCategoryModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  user: User | null;
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
      const result = await categoryApi.createCategory(formData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-teal-100 rounded-xl">
            <Plus className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Thêm danh mục mới
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="Ví dụ: Thuốc giảm đau, Kháng sinh..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mã danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono"
              placeholder="Ví dụ: PAINRELIEF, ANTIBIOTIC..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Mã sẽ được tự động chuyển thành chữ hoa
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
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
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Category Modal
const EditCategoryModal: React.FC<{
  category: MedicineCategory;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  user: User | null;
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
      const result = await categoryApi.updateCategory(category._id, formData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-teal-100 rounded-xl">
            <Edit3 className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Sửa danh mục</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="Ví dụ: Thuốc giảm đau, Kháng sinh..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mã danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono"
              placeholder="Ví dụ: PAINRELIEF, ANTIBIOTIC..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Mã sẽ được tự động chuyển thành chữ hoa
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="Mô tả chi tiết về danh mục thuốc này..."
            />
          </div>

          {/* Hiển thị thông tin trạng thái */}
          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              Thông tin danh mục
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Trạng thái:</span>
                <StatusBadge status={category.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Người tạo:</span>
                <span className="font-medium">{category.createdByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ngày tạo:</span>
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Edit3 className="w-5 h-5" />
                  Cập nhật danh mục
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Detail Modal
const CategoryDetailModal: React.FC<{
  category: MedicineCategory;
  onClose: () => void;
  onViewMedicines: (categoryId: string, categoryName: string) => void;
  token: string | null;
}> = ({ category, onClose, onViewMedicines, token }) => {
  const [detailData, setDetailData] = useState<CategoryDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch detailed category information
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!token) return;

      try {
        setLoading(true);

        // Temporarily skip API call and use existing data until server is running
        console.log("Using fallback data - server may not be running");
        const enhancedData = {
          ...category,
          medicineCount: category.medicineCount || 0,
          myMedicinesInCategory: category.myMedicinesInCategory || 0,
        };
        setDetailData(enhancedData);

        // TODO: Uncomment when server is running
        // const result = await categoryApi.getCategoryDetails(category._id);
        // if (result.success) {
        //   setDetailData(result.data);
        // } else {
        //   setDetailData(enhancedData);
        // }
      } catch (error) {
        console.error("Error fetching category details:", error);
        // Fallback to existing data
        const enhancedData = {
          ...category,
          medicineCount: category.medicineCount || 0,
          myMedicinesInCategory: category.myMedicinesInCategory || 0,
        };
        setDetailData(enhancedData);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryDetails();
  }, [category, token]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 border-b border-teal-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-xl">
                <Package className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Chi tiết danh mục
                </h3>
                <p className="text-sm text-slate-600">
                  Thông tin đầy đủ về danh mục và liên kết thuốc
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-slate-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  Thông tin cơ bản
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Tên danh mục
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {category.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Mã danh mục
                    </p>
                    <p className="text-lg font-mono font-semibold text-slate-900">
                      {category.code}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-600">Mô tả</p>
                    <p className="text-slate-900 mt-1">
                      {category.description || "Không có mô tả"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Trạng thái
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={category.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Ngày tạo
                    </p>
                    <p className="text-slate-900">
                      {new Date(category.createdAt).toLocaleDateString(
                        "vi-VN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Creator Information */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Thông tin người tạo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Người tạo
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {category.createdByName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Vai trò
                    </p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      {category.createdByRole === "admin"
                        ? "👑 Admin"
                        : "👨‍⚕️ Nhân viên"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medicine Statistics */}
              {detailData && (
                <div className="bg-purple-50 p-6 rounded-xl">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-purple-600" />
                    Thống kê thuốc
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Pill className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">
                            Tổng thuốc
                          </p>
                          <p className="text-2xl font-bold text-slate-900">
                            {detailData.medicineCount || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {detailData.myMedicinesInCategory !== undefined && (
                      <div className="bg-white p-4 rounded-lg border border-indigo-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">
                              Thuốc của tôi
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                              {detailData.myMedicinesInCategory || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailData.totalMedicinesFromMyCategories !==
                      undefined && (
                      <div className="bg-white p-4 rounded-lg border border-teal-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-100 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">
                              Từ danh mục của tôi
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                              {detailData.totalMedicinesFromMyCategories || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-teal-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-teal-600" />
                  Thao tác nhanh
                </h4>
                <div className="flex flex-wrap gap-3">
                  {(detailData?.medicineCount || 0) > 0 && (
                    <button
                      onClick={() => {
                        onViewMedicines(category._id, category.name);
                        onClose();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <Pill className="w-4 h-4" />
                      Xem {detailData?.medicineCount || 0} thuốc
                    </button>
                  )}

                  <button
                    onClick={() => {
                      window.location.href = "/medicines?filter=all";
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Package2 className="w-4 h-4" />
                    Xem tất cả thuốc
                  </button>
                </div>
              </div>

              {/* Status Information */}
              {category.status === "rejected" && category.rejectedReason && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-lg font-semibold text-red-900 mb-2">
                        Lý do từ chối
                      </h4>
                      <p className="text-red-800">{category.rejectedReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
