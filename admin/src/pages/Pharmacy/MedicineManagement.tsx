import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Clock,
  User,
  Edit3,
  TrendingUp,
} from "lucide-react";
import {
  adminGetAllMedicines,
  adminGetMedicineStatistics,
  adminDeleteMedicine,
  adminApproveMedicine,
  adminRejectMedicine,
} from "../../api/adminMedicineApi";
import CreateMedicineModal from "../../components/Medicine/CreateMedicineModal";
import EditMedicineModal from "../../components/Medicine/EditMedicineModal";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  code: string;
  categoryName: string;
  activeIngredient: string;
  concentration: string;
  manufacturer: string;
  packaging: {
    tabletsPerStrip: number;
    stripsPerBox: number;
    boxesPerCarton: number;
  };
  status: "active" | "inactive" | "discontinued" | "pending";
  requiresPrescription: boolean;
  createdAt: string;
  createdByName: string;
  createdByRole: string;
  updatedAt?: string;
  updatedByName?: string;
}

interface MedicineStats {
  totalMedicines: number;
  totalStockValue: number;
  stockByStatus: {
    in_stock: { count: number; value: number };
    low_stock: { count: number; value: number };
    out_of_stock: { count: number; value: number };
    overstock: { count: number; value: number };
  };
}

// Enhanced Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    active: {
      color:
        "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200",
      icon: CheckCircle,
      text: "Hoạt động",
      pulse: "",
    },
    inactive: {
      color:
        "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200",
      icon: Clock,
      text: "Tạm ngưng",
      pulse: "",
    },
    discontinued: {
      color:
        "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200",
      icon: XCircle,
      text: "Ngưng SX",
      pulse: "",
    },
    pending: {
      color:
        "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200",
      icon: Clock,
      text: "Chờ duyệt",
      pulse: "animate-pulse",
    },
  };

  const {
    color,
    icon: Icon,
    text,
    pulse,
  } = config[status as keyof typeof config] || config.inactive;

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

const MedicineManagement: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stats, setStats] = useState<MedicineStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<string>("");

  const token = localStorage.getItem("adminToken") || "";

  // Fetch medicines
  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await adminGetAllMedicines(token, {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        status: filterStatus || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (result.data.success) {
        const medicinesData = Array.isArray(result.data.data?.data)
          ? result.data.data.data
          : [];
        setMedicines(medicinesData);
        setTotalPages(result.data.data?.pagination?.totalPages || 1);
      } else {
        console.error("Failed to fetch medicines:", result.data.error);
        setMedicines([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Error fetching medicines:", err);
      setError(
        err?.response?.data?.message || err.message || "Lỗi khi tải danh sách"
      );
      setMedicines([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, searchTerm, filterStatus]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const result = await adminGetMedicineStatistics(token);
      if (result.data.success) {
        setStats(result.data.data);
      } else {
        console.error("Failed to fetch stats:", result.data.error);
        setStats({
          totalMedicines: 0,
          totalStockValue: 0,
          stockByStatus: {
            in_stock: { count: 0, value: 0 },
            low_stock: { count: 0, value: 0 },
            out_of_stock: { count: 0, value: 0 },
            overstock: { count: 0, value: 0 },
          },
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        totalMedicines: 0,
        totalStockValue: 0,
        stockByStatus: {
          in_stock: { count: 0, value: 0 },
          low_stock: { count: 0, value: 0 },
          out_of_stock: { count: 0, value: 0 },
          overstock: { count: 0, value: 0 },
        },
      });
    }
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchMedicines(), fetchStats()]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (token) {
      loadData();
    }
  }, [token, fetchMedicines, fetchStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatPackaging = (packaging: Medicine["packaging"]) => {
    return `${packaging.tabletsPerStrip} viên/vỉ, ${packaging.stripsPerBox} vỉ/hộp, ${packaging.boxesPerCarton} hộp/thùng`;
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApproveMedicine(token, id);
      setMedicines((m) => m.filter((x) => x._id !== id));
      alert("Duyệt thành công");
      fetchMedicines(); // Refresh data
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Duyệt thất bại");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Lý do từ chối (tuỳ chọn):") || "";
    try {
      await adminRejectMedicine(token, id, reason);
      setMedicines((m) => m.filter((x) => x._id !== id));
      alert("Từ chối thành công");
      fetchMedicines(); // Refresh data
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Từ chối thất bại");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thuốc này?")) return;

    try {
      await adminDeleteMedicine(token, id);
      setMedicines((m) => m.filter((x) => x._id !== id));
      alert("Xóa thành công");
      fetchMedicines(); // Refresh data
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Xóa thất bại");
    }
  };

  const handleCreateSuccess = () => {
    fetchMedicines();
    fetchStats();
  };

  const handleEditSuccess = () => {
    fetchMedicines();
    fetchStats();
  };

  const handleEditClick = (medicineId: string) => {
    setEditingMedicineId(medicineId);
    setShowEditModal(true);
  };

  if (loading && medicines.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
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
                Quản lý thuốc
              </h1>
              <p className="text-gray-600 text-lg">
                Quản lý toàn bộ thuốc trong hệ thống
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Thêm thuốc mới
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
                    Tổng thuốc
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 counter-animation">
                    {stats.totalMedicines}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      +8% từ tháng trước
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
                    Giá trị kho
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2 counter-animation">
                    {formatCurrency(stats.totalStockValue)}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      Tổng giá trị
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Sắp hết hàng
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2 counter-animation">
                    {stats.stockByStatus.low_stock?.count || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-yellow-600 font-medium">
                      Cần nhập thêm
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Hết hàng
                  </p>
                  <p className="text-3xl font-bold text-red-600 mt-2 counter-animation">
                    {stats.stockByStatus.out_of_stock?.count || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600 font-medium">
                      Không còn tồn kho
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
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
                  placeholder="Tìm kiếm theo tên thuốc, mã thuốc, hoạt chất..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all min-w-[150px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">✅ Đang hoạt động</option>
                <option value="inactive">⏸️ Tạm ngưng</option>
                <option value="discontinued">❌ Ngưng sản xuất</option>
                <option value="pending">⏳ Chờ duyệt</option>
              </select>

              <button className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white transition-all flex items-center gap-2 text-gray-600">
                <Filter className="w-4 h-4" />
                Bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Modern Medicines Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Thông tin thuốc
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Hoạt chất & Nồng độ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Quy cách đóng gói
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Người tạo
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
                ) : medicines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium text-lg">
                          {searchTerm || filterStatus
                            ? "Không tìm thấy thuốc nào"
                            : "Chưa có thuốc nào"}
                        </p>
                        <p className="text-gray-400 mt-1">
                          {searchTerm || filterStatus
                            ? "Không tìm thấy thuốc phù hợp với bộ lọc."
                            : "Bắt đầu bằng cách thêm thuốc mới vào hệ thống."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  medicines.map((medicine, index) => (
                    <tr
                      key={medicine._id}
                      className="hover:bg-gray-50 transition-color"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">
                                {(currentPage - 1) * 20 + index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {medicine.name}
                            </p>
                            {medicine.genericName && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {medicine.genericName}
                              </p>
                            )}
                            <div className="text-xs text-gray-400 font-mono mt-1">
                              Mã: {medicine.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {medicine.activeIngredient}
                        </div>
                        <div className="text-sm text-gray-600">
                          {medicine.concentration}
                        </div>
                        <div className="text-xs text-gray-500">
                          {medicine.manufacturer}
                        </div>
                        <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full mt-1 inline-block font-medium">
                          {medicine.categoryName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-mono">
                          {formatPackaging(medicine.packaging)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <StatusBadge status={medicine.status} />
                          {medicine.requiresPrescription && (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              Theo toa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                medicine.createdByRole === "admin"
                                  ? "bg-blue-100"
                                  : "bg-purple-100"
                              }`}
                            >
                              <User
                                className={`w-4 h-4 ${
                                  medicine.createdByRole === "admin"
                                    ? "text-blue-600"
                                    : "text-purple-600"
                                }`}
                              />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {medicine.createdByName}
                            </p>
                            <RoleBadge role={medicine.createdByRole} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                            onClick={() => setSelectedMedicine(medicine)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                            onClick={() => handleEditClick(medicine._id)}
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          {medicine.status === "pending" && (
                            <>
                              <button
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                onClick={() => handleApprove(medicine._id)}
                                title="Duyệt"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                onClick={() => handleReject(medicine._id)}
                                title="Từ chối"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            onClick={() => handleDelete(medicine._id)}
                            title="Xóa"
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
                      {(currentPage - 1) * 20 + 1}
                    </span>{" "}
                    -
                    <span className="font-medium">
                      {Math.min(currentPage * 20, stats?.totalMedicines || 0)}
                    </span>
                    trong tổng số{" "}
                    <span className="font-medium">
                      {stats?.totalMedicines || 0}
                    </span>{" "}
                    thuốc
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
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

        {/* Enhanced Medicine Detail Modal */}
        {selectedMedicine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Chi tiết thuốc
                  </h3>
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  onClick={() => setSelectedMedicine(null)}
                  aria-label="Đóng"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Tên thuốc
                    </p>
                    <p className="text-gray-800 font-semibold text-lg">
                      {selectedMedicine.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Biệt dược
                    </p>
                    <p className="text-gray-800 font-semibold">
                      {selectedMedicine.genericName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Mã thuốc
                    </p>
                    <p className="text-gray-800 font-mono font-semibold">
                      {selectedMedicine.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Danh mục
                    </p>
                    <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                      {selectedMedicine.categoryName}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Hoạt chất
                    </p>
                    <p className="text-gray-800 font-semibold">
                      {selectedMedicine.activeIngredient}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Nồng độ/Hàm lượng
                    </p>
                    <p className="text-gray-800 font-semibold">
                      {selectedMedicine.concentration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Nhà sản xuất
                    </p>
                    <p className="text-gray-800 font-semibold">
                      {selectedMedicine.manufacturer}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Đóng gói
                    </p>
                    <p className="text-gray-800 font-mono text-sm">
                      {formatPackaging(selectedMedicine.packaging)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Trạng thái
                    </p>
                    <StatusBadge status={selectedMedicine.status} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Theo toa
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        selectedMedicine.requiresPrescription
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedMedicine.requiresPrescription ? "Có" : "Không"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Thông tin hệ thống
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tạo lúc:</span>
                      <span className="text-gray-800 font-medium">
                        {new Date(selectedMedicine.createdAt).toLocaleString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bởi:</span>
                      <div className="flex items-center gap-2">
                        <RoleBadge role={selectedMedicine.createdByRole} />
                        <span className="text-gray-800 font-medium">
                          {selectedMedicine.createdByName}
                        </span>
                      </div>
                    </div>
                    {selectedMedicine.updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cập nhật lúc:</span>
                        <span className="text-gray-800 font-medium">
                          {new Date(selectedMedicine.updatedAt).toLocaleString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                    )}
                    {selectedMedicine.updatedByName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cập nhật bởi:</span>
                        <span className="text-gray-800 font-medium">
                          {selectedMedicine.updatedByName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Medicine Modal */}
        <CreateMedicineModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* Edit Medicine Modal */}
        <EditMedicineModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingMedicineId("");
          }}
          onSuccess={handleEditSuccess}
          medicineId={editingMedicineId}
        />
      </div>
    </div>
  );
};

export default MedicineManagement;
