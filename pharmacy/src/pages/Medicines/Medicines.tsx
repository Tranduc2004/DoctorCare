import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Package,
  AlertTriangle,
  TrendingDown,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import CreateMedicineModal from "../../components/Medicine/CreateMedicineModal";
import ImportStockModal from "../../components/Medicine/ImportStockModal";
import EditMedicineModal from "../../components/Medicine/EditMedicineModal";
import { medicineApi } from "../../api/medicineApi";
import { Snackbar, Alert } from "@mui/material";
import type { AlertColor } from "@mui/material";

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
  createdBy: string;
  createdByName: string;
}

interface StockStats {
  totalMedicines: number;
  totalStockValue: number;
  stockByStatus: {
    in_stock: { count: number; value: number };
    low_stock: { count: number; value: number };
    out_of_stock: { count: number; value: number };
    overstock: { count: number; value: number };
  };
}

const Medicines: React.FC = () => {
  const { token, user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<AlertColor>("success");

  const notify = (message: string, severity: AlertColor = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const openEdit = (m: Medicine) => {
    setSelectedMedicine(m);
    setShowEditModal(true);
    setShowCreateModal(false);
    setShowImportModal(false);
  };

  // Fetch medicines
  const fetchMedicines = useCallback(async () => {
    try {
      const result = await medicineApi.getMedicines({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        status: filterStatus || undefined,
      });

      if (result.success) {
        // Đảm bảo medicines luôn là mảng
        const medicinesData = Array.isArray(result.data.medicines)
          ? result.data.medicines
          : [];
        setMedicines(medicinesData);
        setTotalPages(result.data.pagination?.totalPages || 1);
      } else {
        console.error("Failed to fetch medicines:", result.error);
        setMedicines([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
      setMedicines([]);
      setTotalPages(1);
    }
  }, [currentPage, searchTerm, filterStatus]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const result = await medicineApi.getStockStatistics();
      if (result.success) {
        setStats(result.data);
      } else {
        console.error("Failed to fetch stats:", result.error);
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
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // Use real API calls
        await Promise.all([fetchMedicines(), fetchStats()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
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
    return `${packaging.tabletsPerStrip} vien/vi, ${packaging.stripsPerBox} vi/hop, ${packaging.boxesPerCarton} hop/thung`;
  };

  const handleCreateSuccess = () => {
    fetchMedicines();
    fetchStats();
  };

  const canEdit = (m: Medicine) =>
    m.status === "pending" && Boolean(user?.id) && m.createdBy === user!.id;

  const handleImportSuccess = () => {
    fetchMedicines();
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                Quản lý thuốc
              </h1>
              <p className="text-slate-600 text-lg">
                Quản lý thông tin thuốc và tồn kho
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Package className="w-5 h-5" />
                Nhập hàng
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Thêm thuốc mới
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Tổng thuốc
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats.totalMedicines}
                  </p>
                  <div className="flex items-center mt-2">
                    <Package className="w-4 h-4 text-teal-500 mr-1" />
                    <span className="text-sm text-teal-600 font-medium">
                      Đang quản lý
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
                    Giá trị kho
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {formatCurrency(stats.totalStockValue)}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      Tổng giá trị
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingDown className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Sắp hết hàng
                  </p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">
                    {stats.stockByStatus.low_stock?.count || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mr-1" />
                    <span className="text-sm text-amber-600 font-medium">
                      Cần nhập thêm
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Hết hàng
                  </p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {stats.stockByStatus.out_of_stock?.count || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600 font-medium">
                      Không còn tồn kho
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên thuốc, mã thuốc, hoạt chất..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white/70 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 focus:bg-white transition-all min-w-[150px]"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
                <option value="discontinued">Ngưng sản xuất</option>
                <option value="pending">Chờ duyệt</option>
              </select>

              <button className="px-4 py-3 border border-slate-200 rounded-xl bg-white/70 hover:bg-white transition-all flex items-center gap-2 text-slate-600">
                <Filter className="w-4 h-4" />
                Bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Medicines Table */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-teal-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thuốc
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thông tin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Quy cách
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-200">
                {medicines.map((medicine) => (
                  <tr
                    key={medicine._id}
                    className="hover:bg-white/80 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {medicine.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {medicine.genericName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Mã: {medicine.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {medicine.activeIngredient}
                      </div>
                      <div className="text-sm text-slate-600">
                        {medicine.concentration}
                      </div>
                      <div className="text-xs text-slate-500">
                        {medicine.manufacturer}
                      </div>
                      <div className="text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded-full mt-1 inline-block font-medium">
                        {medicine.categoryName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-mono">
                        {formatPackaging(medicine.packaging)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            medicine.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : medicine.status === "inactive"
                              ? "bg-amber-100 text-amber-800"
                              : medicine.status === "discontinued"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {medicine.status === "active"
                            ? "Hoạt động"
                            : medicine.status === "inactive"
                            ? "Tạm ngưng"
                            : medicine.status === "discontinued"
                            ? "Ngưng SX"
                            : "Chờ duyệt"}
                        </span>
                        {medicine.requiresPrescription && (
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Theo toa
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit(medicine) && (
                          <button
                            className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            onClick={() => openEdit(medicine)}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit(medicine) && (
                          <button
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Bạn chắc chắn muốn xóa thuốc đang chờ duyệt này?"
                                )
                              )
                                return;
                              try {
                                const result = await medicineApi.deleteMedicine(
                                  medicine._id
                                );
                                if (result.success) {
                                  fetchMedicines();
                                  notify("Xóa thuốc thành công", "success");
                                }
                              } catch (e) {
                                console.error("Failed to delete medicine", e);
                                notify(
                                  e instanceof Error
                                    ? e.message
                                    : "Xóa thuốc thất bại",
                                  "error"
                                );
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-t border-teal-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-slate-700 font-medium">
                    Trang {currentPage} của {totalPages}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm bg-white text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 transition-colors"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm bg-white text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {medicines.length === 0 && !loading && (
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-teal-100 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {searchTerm || filterStatus
                ? "Không tìm thấy thuốc nào"
                : "Chưa có thuốc nào"}
            </h3>
            <p className="text-slate-500">
              {searchTerm || filterStatus
                ? "Không tìm thấy thuốc phù hợp với bộ lọc."
                : "Bắt đầu bằng cách thêm thuốc mới vào hệ thống."}
            </p>
          </div>
        )}

        {/* Modals */}
        {selectedMedicine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-slate-200 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  Chi tiết thuốc
                </h3>
                <button
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                  onClick={() => {
                    setSelectedMedicine(null);
                  }}
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-500">Tên thuốc</p>
                      <p className="text-slate-800 font-medium">
                        {selectedMedicine.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Biệt dược</p>
                      <p className="text-slate-800 font-medium">
                        {selectedMedicine.genericName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Mã</p>
                      <p className="text-slate-800 font-medium">
                        {selectedMedicine.code}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Danh mục</p>
                      <p className="text-slate-800 font-medium">
                        {selectedMedicine.categoryName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Hoạt chất</p>
                      <p className="text-slate-800 font-medium">
                        {selectedMedicine.activeIngredient}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">
                        Nồng độ/Hàm lượng
                      </p>
                      <p className="text-slate-800 font-medium">
                        {selectedMedicine.concentration}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Nhà sản xuất</p>
                      <p className="text-slate-800 font-medium">
                        {selectedMedicine.manufacturer}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Đóng gói</p>
                      <p className="text-slate-800 font-medium">
                        {formatPackaging(selectedMedicine.packaging)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Trạng thái</p>
                      <p className="text-slate-800 font-medium">
                        {selectedMedicine.status === "active"
                          ? "Hoạt động"
                          : selectedMedicine.status === "inactive"
                          ? "Tạm ngưng"
                          : selectedMedicine.status === "discontinued"
                          ? "Ngưng SX"
                          : "Chờ duyệt"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Theo toa</p>
                      <p className="text-slate-800 font-medium">
                        {selectedMedicine.requiresPrescription ? "Có" : "Không"}
                      </p>
                    </div>
                  </div>
                }
                <div className="mt-6 text-sm text-slate-500">
                  <p>
                    Tạo lúc:{" "}
                    <span className="text-slate-800 font-medium">
                      {new Date(selectedMedicine.createdAt).toLocaleString()}
                    </span>
                  </p>
                  <p>
                    Bởi:{" "}
                    <span className="text-slate-800 font-medium">
                      {selectedMedicine.createdByName}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <CreateMedicineModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          onNotify={notify}
        />

        <ImportStockModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />

        <EditMedicineModal
          isOpen={showEditModal}
          medicineId={selectedMedicine?._id || null}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchMedicines();
            fetchStats();
          }}
          onNotify={notify}
        />

        {/* Global Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
            variant="filled"
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default Medicines;
