import React, { useEffect, useState } from "react";
import {
  Package,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import {
  adminGetPendingMedicines,
  adminApproveMedicine,
  adminRejectMedicine,
} from "../../api/adminMedicineApi";
import MedicineManagement from "./MedicineManagement";

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

// Enhanced Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
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

const MedicinesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<"pending" | "management">("pending");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );

  const token = localStorage.getItem("adminToken") || "";

  const formatPackaging = (packaging: Medicine["packaging"]) => {
    return `${packaging.tabletsPerStrip} viên/vỉ, ${packaging.stripsPerBox} vỉ/hộp, ${packaging.boxesPerCarton} hộp/thùng`;
  };

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetPendingMedicines(token);
      // Xử lý cấu trúc dữ liệu từ API
      const medicinesData = res.data?.data?.data || res.data?.data || [];
      setMedicines(Array.isArray(medicinesData) ? medicinesData : []);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || err.message || "Lỗi khi tải danh sách"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "pending") {
      fetchPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const handleApprove = async (id: string) => {
    try {
      await adminApproveMedicine(token, id);
      setMedicines((m) => m.filter((x) => x._id !== id));
      alert("Duyệt thành công");
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
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Từ chối thất bại");
    }
  };

  // Render Medicine Management view
  if (viewMode === "management") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setViewMode("pending")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại thuốc chờ duyệt
          </button>
        </div>
        <MedicineManagement />
      </div>
    );
  }

  // Render Pending Medicines view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Thuốc chờ duyệt
              </h1>
              <p className="text-gray-600 text-lg">
                Duyệt các thuốc do nhân viên tạo
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode("management")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Package className="w-5 h-5" />
                Quản lý tất cả thuốc
              </button>
            </div>
          </div>
        </div>

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

        {/* Modern Pending Medicines Table */}
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
                          {searchTerm
                            ? "Không tìm thấy thuốc nào"
                            : "Không có thuốc chờ duyệt"}
                        </p>
                        <p className="text-gray-400 mt-1">
                          {searchTerm
                            ? "Không tìm thấy thuốc phù hợp với bộ lọc."
                            : "Tất cả thuốc đã được duyệt hoặc chưa có thuốc nào được tạo."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  medicines
                    .filter((medicine) =>
                      searchTerm
                        ? medicine.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          medicine.code
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          medicine.activeIngredient
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        : true
                    )
                    .map((medicine, index) => (
                      <tr
                        key={medicine._id}
                        className="hover:bg-gray-50 transition-color"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm">
                                  {index + 1}
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
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
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
                    Chi tiết thuốc chờ duyệt
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
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      handleApprove(selectedMedicine._id);
                      setSelectedMedicine(null);
                    }}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Duyệt thuốc
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedMedicine._id);
                      setSelectedMedicine(null);
                    }}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicinesPage;
