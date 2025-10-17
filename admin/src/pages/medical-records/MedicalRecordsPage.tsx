import React, { useState, useEffect } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { validateToken, getTokenInfo } from "../../utils/tokenUtils";
import AuthDebugPanel from "../../components/AuthDebugPanel";
import {
  getMedicalRecords,
  getMedicalRecordById,
  getMedicalRecordsStats,
  updateMedicalRecordStatus,
  deleteMedicalRecord,
} from "../../api/medicalRecordApi";
import type {
  MedicalRecordFilters,
  MedicalRecordStats,
} from "../../api/medicalRecordApi";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  FileText,
  User,
  TrendingUp,
  Users,
  Activity,
  X,
  RefreshCw,
} from "lucide-react";

interface MedicalRecord {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  doctor: {
    _id: string;
    name: string;
    email: string;
    specialty: {
      name: string;
    };
    workplace?: string;
  };
  status: "draft" | "completed" | "archived";
  consultationType: "online" | "offline";
  diagnosis?: string;
  preliminaryDiagnosis?: string;
  reasonForVisit?: string;
  createdAt: string;
  completedAt?: string;
  patientInfo?: {
    fullName: string;
    birthYear?: number;
    gender?: string;
  };
}

interface PaginatedResponse {
  records: MedicalRecord[];
  pagination: {
    current: number;
    total: number;
    count: number;
    limit: number;
  };
}

const MedicalRecordsPage: React.FC = () => {
  const { token, admin, isAuthenticated, logout } = useAdminAuth();

  // Debug logging
  useEffect(() => {
    console.log("MedicalRecordsPage Auth State:", {
      hasToken: !!token,
      tokenLength: token?.length,
      hasAdmin: !!admin,
      isAuthenticated,
      adminUsername: admin?.username,
    });

    // Validate token if present
    if (token) {
      const validation = validateToken(token);
      const tokenInfo = getTokenInfo(token);

      console.log("Token validation result:", validation);
      console.log("Token info:", tokenInfo);

      if (!validation.isValid) {
        console.warn("Token is invalid or expired");
        if (validation.isExpired) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          logout();
        }
      }
    }
  }, [token, admin, isAuthenticated, logout]);

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<MedicalRecordStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    limit: 10,
  });

  // Filters
  const [filters, setFilters] = useState<MedicalRecordFilters>({
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load medical records
  const loadMedicalRecords = async () => {
    if (!token) {
      console.warn("No token available for loading medical records");
      return;
    }

    try {
      setLoading(true);
      console.log("Loading medical records with filters:", filters);
      const response: PaginatedResponse = await getMedicalRecords(
        token,
        filters
      );
      setRecords(response.records);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error("Error loading medical records:", error);

      // Check if it's an auth error
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        logout();
      } else if (error.response?.status === 403) {
        alert("Bạn không có quyền truy cập chức năng này.");
      } else if (error.response?.status >= 500) {
        alert("Lỗi server. Vui lòng thử lại sau.");
      } else {
        alert("Có lỗi xảy ra khi tải danh sách bệnh án. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    if (!token) {
      console.warn("No token available for loading stats");
      return;
    }

    try {
      const statsData = await getMedicalRecordsStats(token, "month");
      setStats(statsData);
    } catch (error: any) {
      console.error("Error loading stats:", error);
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        logout();
      } else {
        alert("Có lỗi xảy ra khi tải thống kê.");
      }
    }
  };

  useEffect(() => {
    loadMedicalRecords();
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // View detail
  const handleViewDetail = async (id: string) => {
    if (!token) return;

    try {
      const record = await getMedicalRecordById(token, id);
      setSelectedRecord(record);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error loading record detail:", error);
    }
  };

  // Update status
  const handleStatusUpdate = async (id: string, status: string) => {
    if (!token) return;

    try {
      await updateMedicalRecordStatus(token, id, status);
      loadMedicalRecords(); // Reload data
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Delete record
  const handleDelete = async (id: string) => {
    if (!token) return;

    if (window.confirm("Bạn có chắc chắn muốn xóa bệnh án này?")) {
      try {
        await deleteMedicalRecord(token, id);
        loadMedicalRecords(); // Reload data
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      draft: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
    };
    const labels = {
      draft: "Nháp",
      completed: "Hoàn thành",
      archived: "Lưu trữ",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          badges[status as keyof typeof badges]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Bệnh án</h1>
          <p className="text-gray-600">
            Quản lý và theo dõi bệnh án của bệnh nhân
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              loadStats();
              setShowStatsModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Thống kê
          </button>
          <button
            onClick={loadMedicalRecords}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng bệnh án</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.count}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
              <p className="text-2xl font-bold text-green-600">
                {
                  records.filter((record) => record.status === "completed")
                    .length
                }
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đang soạn</p>
              <p className="text-2xl font-bold text-yellow-600">
                {records.filter((record) => record.status === "draft").length}
              </p>
            </div>
            <Edit className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trực tuyến</p>
              <p className="text-2xl font-bold text-blue-600">
                {
                  records.filter(
                    (record) => record.consultationType === "online"
                  ).length
                }
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bệnh nhân, bác sĩ hoặc chẩn đoán..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Bộ lọc
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="draft">Nháp</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại khám
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.consultationType || ""}
                  onChange={(e) =>
                    handleFilterChange("consultationType", e.target.value)
                  }
                >
                  <option value="">Tất cả</option>
                  <option value="online">Trực tuyến</option>
                  <option value="offline">Tại phòng khám</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bệnh nhân
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bác sĩ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chẩn đoán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại khám
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Không tìm thấy bệnh án nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.patientInfo?.fullName ||
                              record.patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.patient.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        BS. {record.doctor.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.doctor.specialty.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {record.diagnosis ||
                          record.preliminaryDiagnosis ||
                          record.reasonForVisit ||
                          "Chưa có chẩn đoán"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.consultationType === "online"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {record.consultationType === "online"
                          ? "Trực tuyến"
                          : "Tại phòng khám"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetail(record._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {record.status === "draft" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(record._id, "completed")
                            }
                            className="text-green-600 hover:text-green-900"
                            title="Đánh dấu hoàn thành"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.total}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị{" "}
                  <span className="font-medium">
                    {(pagination.current - 1) * pagination.limit + 1}
                  </span>{" "}
                  đến{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.current * pagination.limit,
                      pagination.count
                    )}
                  </span>{" "}
                  trong tổng số{" "}
                  <span className="font-medium">{pagination.count}</span> kết
                  quả
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  {Array.from({ length: pagination.total }, (_, i) => i + 1)
                    .slice(
                      Math.max(0, pagination.current - 3),
                      Math.min(pagination.total, pagination.current + 2)
                    )
                    .map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.current
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  <button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.total}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-gray-500/90 bg-opacity-75 transition-opacity"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chi tiết Bệnh án
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Patient & Doctor Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">
                      Thông tin bệnh nhân
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Tên:</span>{" "}
                        {selectedRecord.patientInfo?.fullName ||
                          selectedRecord.patient.name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        {selectedRecord.patient.email}
                      </div>
                      {selectedRecord.patient.phone && (
                        <div>
                          <span className="font-medium">SĐT:</span>{" "}
                          {selectedRecord.patient.phone}
                        </div>
                      )}
                      {selectedRecord.patientInfo?.birthYear && (
                        <div>
                          <span className="font-medium">Năm sinh:</span>{" "}
                          {selectedRecord.patientInfo.birthYear}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-3">
                      Thông tin bác sĩ
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Tên:</span> BS.{" "}
                        {selectedRecord.doctor.name}
                      </div>
                      <div>
                        <span className="font-medium">Chuyên khoa:</span>{" "}
                        {selectedRecord.doctor.specialty.name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        {selectedRecord.doctor.email}
                      </div>
                      {selectedRecord.doctor.workplace && (
                        <div>
                          <span className="font-medium">Nơi làm việc:</span>{" "}
                          {selectedRecord.doctor.workplace}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Record Details */}
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-3">
                      Thông tin khám
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Trạng thái:</span>{" "}
                        {getStatusBadge(selectedRecord.status)}
                      </div>
                      <div>
                        <span className="font-medium">Loại khám:</span>{" "}
                        {selectedRecord.consultationType === "online"
                          ? "Trực tuyến"
                          : "Tại phòng khám"}
                      </div>
                      <div>
                        <span className="font-medium">Ngày tạo:</span>{" "}
                        {formatDate(selectedRecord.createdAt)}
                      </div>
                      {selectedRecord.completedAt && (
                        <div>
                          <span className="font-medium">Hoàn thành:</span>{" "}
                          {formatDate(selectedRecord.completedAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRecord.reasonForVisit && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">
                        Lý do khám
                      </h4>
                      <p className="text-sm text-red-800">
                        {selectedRecord.reasonForVisit}
                      </p>
                    </div>
                  )}

                  {selectedRecord.preliminaryDiagnosis && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">
                        Chẩn đoán sơ bộ
                      </h4>
                      <p className="text-sm text-orange-800">
                        {selectedRecord.preliminaryDiagnosis}
                      </p>
                    </div>
                  )}

                  {selectedRecord.diagnosis && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">
                        Chẩn đoán cuối cùng
                      </h4>
                      <p className="text-sm text-purple-800">
                        {selectedRecord.diagnosis}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  {selectedRecord.status === "draft" && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedRecord._id, "completed");
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Đánh dấu hoàn thành
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && stats && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={() => setShowStatsModal(false)}
          />
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Thống kê Bệnh án
                </h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.overview.totalRecords}
                    </p>
                    <p className="text-sm text-blue-800">Tổng bệnh án</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.overview.completedRecords}
                    </p>
                    <p className="text-sm text-green-800">Đã hoàn thành</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.overview.draftRecords}
                    </p>
                    <p className="text-sm text-yellow-800">Đang soạn</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.overview.onlineRecords}
                    </p>
                    <p className="text-sm text-purple-800">Trực tuyến</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {stats.overview.offlineRecords}
                    </p>
                    <p className="text-sm text-indigo-800">Tại phòng khám</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-teal-600">
                      {stats.overview.recordsInPeriod}
                    </p>
                    <p className="text-sm text-teal-800">Tháng này</p>
                  </div>
                </div>

                {/* Top Doctors */}
                {stats.charts.topDoctors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">
                      Bác sĩ hoạt động tích cực nhất
                    </h4>
                    <div className="space-y-2">
                      {stats.charts.topDoctors.map((doctor, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              BS. {doctor.doctor.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {doctor.doctor.specialty}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {doctor.count}
                            </p>
                            <p className="text-sm text-gray-600">bệnh án</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={() => setShowStatsModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Debug Panel */}
      <AuthDebugPanel
        token={token}
        admin={admin}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
};

export default MedicalRecordsPage;
