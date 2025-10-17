import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Calendar,
  Filter,
  Pill,
  User,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  Download,
  Printer,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getPatientPrescriptions,
  searchPrescriptions,
  getPrescriptionsByDateRange,
  getPrescriptionsByStatus,
  Prescription,
  PrescriptionResponse,
} from "../../../api/prescriptionApi";

const PrescriptionsPage: React.FC = () => {
  const { user } = useAuth();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed" | "cancelled"
  >("all");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const loadPrescriptions = useCallback(
    async (page: number = 1) => {
      if (!user?._id) return;

      setLoading(true);
      setError("");

      try {
        let response: PrescriptionResponse;

        if (searchQuery.trim()) {
          response = await searchPrescriptions(
            user._id,
            searchQuery.trim(),
            page,
            limit
          );
        } else if (dateRange.startDate && dateRange.endDate) {
          response = await getPrescriptionsByDateRange(
            user._id,
            dateRange.startDate,
            dateRange.endDate,
            page,
            limit
          );
        } else if (statusFilter !== "all") {
          response = await getPrescriptionsByStatus(
            user._id,
            statusFilter,
            page,
            limit
          );
        } else {
          response = await getPatientPrescriptions(user._id, page, limit);
        }

        setPrescriptions(response.prescriptions);
        if (response.pagination) {
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.total);
          setTotalCount(response.pagination.count);
        }
      } catch (err) {
        console.error("Error loading prescriptions:", err);
        setError("Không thể tải danh sách đơn thuốc. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    },
    [
      user?._id,
      searchQuery,
      dateRange.startDate,
      dateRange.endDate,
      statusFilter,
    ]
  );

  useEffect(() => {
    loadPrescriptions();
  }, [user?._id]); // eslint-disable-line

  const handleSearch = () => {
    setCurrentPage(1);
    loadPrescriptions(1);
  };

  const handleStatusFilter = (
    status: "all" | "active" | "completed" | "cancelled"
  ) => {
    setStatusFilter(status);
    setCurrentPage(1);
    setSearchQuery("");
    setDateRange({ startDate: "", endDate: "" });
  };

  const handleDateRangeFilter = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError("Vui lòng chọn đầy đủ khoảng thời gian");
      return;
    }
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("all");
    loadPrescriptions(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange({ startDate: "", endDate: "" });
    setCurrentPage(1);
    loadPrescriptions(1);
  };

  const viewPrescriptionDetail = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailModal(true);
  };

  const printPrescription = (prescription: Prescription) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Đơn thuốc #${prescription._id.slice(-8)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #14B8A6; padding-bottom: 20px; margin-bottom: 30px; }
              .prescription-info { margin-bottom: 20px; }
              .medication { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
              .medication-name { font-weight: bold; font-size: 18px; color: #14B8A6; }
              .medication-details { margin-top: 10px; }
              .notes { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>MediCare - Đơn thuốc</h1>
              <p>Mã đơn: #${prescription._id.slice(-8)}</p>
            </div>
            
            <div class="prescription-info">
              <p><strong>Bác sĩ:</strong> ${prescription.doctor.name}</p>
              <p><strong>Ngày kê đơn:</strong> ${formatDate(
                prescription.prescriptionDate
              )}</p>
              <p><strong>Trạng thái:</strong> ${getStatusText(
                prescription.status
              )}</p>
              ${
                prescription.medicalRecord
                  ? `<p><strong>Chẩn đoán:</strong> ${prescription.medicalRecord.diagnosis}</p>`
                  : ""
              }
            </div>

            <h3>Danh sách thuốc (${prescription.medications.length} loại):</h3>
            ${prescription.medications
              .map(
                (m, i) => `
              <div class="medication">
                <div class="medication-name">${i + 1}. ${m.name} ${
                  m.strength
                }</div>
                <div class="medication-details">
                  <p><strong>Dạng thuốc:</strong> ${m.form}</p>
                  <p><strong>Liều dùng:</strong> ${m.dosage}</p>
                  <p><strong>Tần suất:</strong> ${m.frequency} lần/ngày</p>
                  <p><strong>Thời gian:</strong> ${m.duration} ngày</p>
                  <p><strong>Số lượng:</strong> ${m.quantity}</p>
                  ${
                    m.instructions
                      ? `<p><strong>Hướng dẫn:</strong> ${m.instructions}</p>`
                      : ""
                  }
                </div>
              </div>
            `
              )
              .join("")}

            ${
              prescription.notes
                ? `
              <div class="notes">
                <h4>Ghi chú:</h4>
                <p>${prescription.notes}</p>
              </div>
            `
                : ""
            }

            <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
              In lúc: ${new Date().toLocaleString("vi-VN")} - MediCare System
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const downloadPrescription = (prescription: Prescription) => {
    const content = `
MEDICARE - ĐƠN THUỐC
=====================

Mã đơn: #${prescription._id.slice(-8)}
Bác sĩ: ${prescription.doctor.name}
Ngày kê đơn: ${formatDate(prescription.prescriptionDate)}
Trạng thái: ${getStatusText(prescription.status)}
${
  prescription.medicalRecord
    ? `Chẩn đoán: ${prescription.medicalRecord.diagnosis}`
    : ""
}

DANH SÁCH THUỐC (${prescription.medications.length} loại):
${prescription.medications
  .map(
    (m, i) => `
${i + 1}. ${m.name} ${m.strength}
   - Dạng thuốc: ${m.form}
   - Liều dùng: ${m.dosage}
   - Tần suất: ${m.frequency} lần/ngày
   - Thời gian: ${m.duration} ngày
   - Số lượng: ${m.quantity}
   ${m.instructions ? `- Hướng dẫn: ${m.instructions}` : ""}
`
  )
  .join("")}

${prescription.notes ? `GHI CHÚ:\n${prescription.notes}\n` : ""}
=====================
Tải xuống lúc: ${new Date().toLocaleString("vi-VN")}
MediCare System
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `don-thuoc-${prescription._id.slice(-8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case "completed":
        return "bg-blue-50 text-blue-700 ring-blue-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 ring-rose-200";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Activity size={14} className="text-emerald-600" />;
      case "completed":
        return <CheckCircle size={14} className="text-blue-600" />;
      case "cancelled":
        return <XCircle size={14} className="text-rose-600" />;
      default:
        return <Clock size={14} className="text-slate-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Đang sử dụng";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  /* ------------ Loading skeleton ------------ */
  if (loading && prescriptions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#EAF9F6] to-white p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-[#14B8A6]/20 bg-white/70 p-6 shadow-sm backdrop-blur">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-1/3 rounded bg-slate-200" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------ UI ------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#EAF9F6] to-white p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header with clean design */}
        <div className="rounded-2xl border border-[#14B8A6]/20 bg-white/70 shadow-sm backdrop-blur">
          <div className="px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="rounded-xl bg-teal-500 p-3">
                  <Pill size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Đơn thuốc của tôi
                  </h1>
                  <p className="mt-1 text-gray-600">
                    Quản lý và theo dõi các đơn thuốc được kê bởi bác sĩ
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-6 py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalCount}
                  </div>
                  <div className="text-sm text-gray-600">Tổng đơn thuốc</div>
                </div>
              </div>
            </div>

            {/* Enhanced Search & Filters */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[300px]">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Tìm kiếm theo tên thuốc, bác sĩ hoặc chẩn đoán..."
                    className="w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 py-3 text-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
                >
                  <Search size={18} className="inline mr-2" />
                  Tìm kiếm
                </button>
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="inline-flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Filter size={18} />
                  Bộ lọc
                  {showFilters ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="rounded-xl border border-[#14B8A6]/20 bg-gray-50/70 p-6 backdrop-blur">
                  {/* Status Filter with simple design */}
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Activity size={16} />
                      Trạng thái đơn thuốc
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {[
                        {
                          value: "all",
                          label: "Tất cả",
                          icon: <FileText size={14} />,
                        },
                        {
                          value: "active",
                          label: "Đang sử dụng",
                          icon: <Activity size={14} />,
                        },
                        {
                          value: "completed",
                          label: "Đã hoàn thành",
                          icon: <CheckCircle size={14} />,
                        },
                        {
                          value: "cancelled",
                          label: "Đã hủy",
                          icon: <XCircle size={14} />,
                        },
                      ].map((s) => (
                        <button
                          key={s.value}
                          onClick={() =>
                            handleStatusFilter(
                              s.value as
                                | "all"
                                | "active"
                                | "completed"
                                | "cancelled"
                            )
                          }
                          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
                            statusFilter === s.value
                              ? "bg-teal-500 text-white border-teal-500"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {s.icon}
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date range filter with simple design */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Calendar size={16} />
                      Khoảng thời gian
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) =>
                          setDateRange((d) => ({
                            ...d,
                            startDate: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />
                      <span className="text-gray-500 font-medium">đến</span>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) =>
                          setDateRange((d) => ({
                            ...d,
                            endDate: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                    <button
                      onClick={handleDateRangeFilter}
                      className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
                    >
                      Áp dụng
                    </button>
                    <button
                      onClick={clearFilters}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean Prescription List */}
        <div className="overflow-hidden rounded-2xl border border-[#14B8A6]/20 bg-white/70 shadow-sm backdrop-blur">
          {prescriptions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto mb-6 rounded-full bg-gray-100 p-6 w-fit">
                <Pill className="text-gray-600" size={48} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Chưa có đơn thuốc
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all" || dateRange.startDate
                  ? "Không tìm thấy đơn thuốc phù hợp với bộ lọc hiện tại."
                  : "Đơn thuốc sẽ hiển thị tại đây sau khi bác sĩ kê đơn cho bạn."}
              </p>
              {(searchQuery ||
                statusFilter !== "all" ||
                dateRange.startDate) && (
                <button
                  onClick={clearFilters}
                  className="mt-6 rounded-lg bg-teal-500 px-6 py-3 text-white font-medium hover:bg-teal-600 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {prescriptions.map((p) => (
                  <div
                    key={p._id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left Content */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-teal-500 p-2">
                              <Pill size={20} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                              Đơn thuốc #{p._id.slice(-8)}
                            </h3>
                          </div>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-2 ${getStatusColor(
                              p.status
                            )}`}
                          >
                            {getStatusIcon(p.status)}
                            {getStatusText(p.status)}
                          </span>
                        </div>

                        <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#14B8A6]/5">
                            <User size={18} className="text-[#14B8A6]" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Bác sĩ
                              </div>
                              <div className="text-gray-600">
                                {p.doctor.name}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#14B8A6]/5">
                            <Calendar size={18} className="text-[#14B8A6]" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Ngày kê
                              </div>
                              <div className="text-gray-600">
                                {formatDate(p.prescriptionDate)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#14B8A6]/5">
                            <Pill size={18} className="text-[#14B8A6]" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Số thuốc
                              </div>
                              <div className="text-gray-600">
                                {p.medications.length} loại
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Clean medications preview */}
                        <div className="mb-4">
                          <div className="mb-3 font-semibold text-gray-900">
                            Danh sách thuốc:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {p.medications.slice(0, 3).map((m, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 border border-blue-200"
                              >
                                <Pill size={14} />
                                {m.name} {m.strength}
                              </span>
                            ))}
                            {p.medications.length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 border border-gray-200">
                                +{p.medications.length - 3} thuốc khác
                              </span>
                            )}
                          </div>
                        </div>

                        {p.medicalRecord && (
                          <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                            <div className="flex items-start gap-2">
                              <FileText
                                size={16}
                                className="text-yellow-600 mt-0.5"
                              />
                              <div>
                                <span className="font-semibold text-yellow-800">
                                  Chẩn đoán:
                                </span>
                                <span className="ml-2 text-yellow-700">
                                  {p.medicalRecord.diagnosis}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Clean Action Buttons */}
                      <div className="ml-6 flex flex-col gap-2">
                        <button
                          onClick={() => viewPrescriptionDetail(p)}
                          className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
                        >
                          <Eye size={16} />
                          Chi tiết
                        </button>
                        <button
                          onClick={() => printPrescription(p)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                        >
                          <Printer size={16} />
                          In đơn
                        </button>
                        <button
                          onClick={() => downloadPrescription(p)}
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition-colors"
                        >
                          <Download size={16} />
                          Tải xuống
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clean Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="text-sm text-gray-600">
                    Hiển thị{" "}
                    <span className="font-semibold text-gray-900">
                      {(currentPage - 1) * limit + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-gray-900">
                      {Math.min(currentPage * limit, totalCount)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-semibold text-gray-900">
                      {totalCount}
                    </span>{" "}
                    đơn thuốc
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadPrescriptions(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(
                        1,
                        Math.min(currentPage - 2 + i, totalPages - 4 + i)
                      );
                      return (
                        <button
                          key={pageNum}
                          onClick={() => loadPrescriptions(pageNum)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? "border-teal-500 bg-teal-500 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => loadPrescriptions(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPrescription && (
        <PrescriptionDetailModal
          prescription={selectedPrescription}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPrescription(null);
          }}
        />
      )}
    </div>
  );
};

/* ================= Modal ================= */

interface PrescriptionDetailModalProps {
  prescription: Prescription;
  onClose: () => void;
}

const PrescriptionDetailModal: React.FC<PrescriptionDetailModalProps> = ({
  prescription,
  onClose,
}) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const printPrescription = (prescription: Prescription) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Đơn thuốc #${prescription._id.slice(-8)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #14B8A6; padding-bottom: 20px; margin-bottom: 30px; }
              .prescription-info { margin-bottom: 20px; }
              .medication { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
              .medication-name { font-weight: bold; font-size: 18px; color: #14B8A6; }
              .medication-details { margin-top: 10px; }
              .notes { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>MediCare - Đơn thuốc</h1>
              <p>Mã đơn: #${prescription._id.slice(-8)}</p>
            </div>
            
            <div class="prescription-info">
              <p><strong>Bác sĩ:</strong> ${prescription.doctor.name}</p>
              <p><strong>Ngày kê đơn:</strong> ${formatDate(
                prescription.prescriptionDate
              )}</p>
              <p><strong>Trạng thái:</strong> ${getStatusText(
                prescription.status
              )}</p>
              ${
                prescription.medicalRecord
                  ? `<p><strong>Chẩn đoán:</strong> ${prescription.medicalRecord.diagnosis}</p>`
                  : ""
              }
            </div>

            <h3>Danh sách thuốc (${prescription.medications.length} loại):</h3>
            ${prescription.medications
              .map(
                (m, i) => `
              <div class="medication">
                <div class="medication-name">${i + 1}. ${m.name} ${
                  m.strength
                }</div>
                <div class="medication-details">
                  <p><strong>Dạng thuốc:</strong> ${m.form}</p>
                  <p><strong>Liều dùng:</strong> ${m.dosage}</p>
                  <p><strong>Tần suất:</strong> ${m.frequency} lần/ngày</p>
                  <p><strong>Thời gian:</strong> ${m.duration} ngày</p>
                  <p><strong>Số lượng:</strong> ${m.quantity}</p>
                  ${
                    m.instructions
                      ? `<p><strong>Hướng dẫn:</strong> ${m.instructions}</p>`
                      : ""
                  }
                </div>
              </div>
            `
              )
              .join("")}

            ${
              prescription.notes
                ? `
              <div class="notes">
                <h4>Ghi chú:</h4>
                <p>${prescription.notes}</p>
              </div>
            `
                : ""
            }

            <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
              In lúc: ${new Date().toLocaleString("vi-VN")} - MediCare System
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const downloadPrescription = (prescription: Prescription) => {
    const content = `
MEDICARE - ĐƠN THUỐC
=====================

Mã đơn: #${prescription._id.slice(-8)}
Bác sĩ: ${prescription.doctor.name}
Ngày kê đơn: ${formatDate(prescription.prescriptionDate)}
Trạng thái: ${getStatusText(prescription.status)}
${
  prescription.medicalRecord
    ? `Chẩn đoán: ${prescription.medicalRecord.diagnosis}`
    : ""
}

DANH SÁCH THUỐC (${prescription.medications.length} loại):
${prescription.medications
  .map(
    (m, i) => `
${i + 1}. ${m.name} ${m.strength}
   - Dạng thuốc: ${m.form}
   - Liều dùng: ${m.dosage}
   - Tần suất: ${m.frequency} lần/ngày
   - Thời gian: ${m.duration} ngày
   - Số lượng: ${m.quantity}
   ${m.instructions ? `- Hướng dẫn: ${m.instructions}` : ""}
`
  )
  .join("")}

${prescription.notes ? `GHI CHÚ:\n${prescription.notes}\n` : ""}
=====================
Tải xuống lúc: ${new Date().toLocaleString("vi-VN")}
MediCare System
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `don-thuoc-${prescription._id.slice(-8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case "completed":
        return "bg-blue-50 text-blue-700 ring-blue-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 ring-rose-200";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Đang sử dụng";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Clean Header */}
        <div className="bg-teal-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Pill size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Chi tiết đơn thuốc</h2>
                <p className="text-teal-100">
                  Mã đơn: #{prescription._id.slice(-8)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  printPrescription(prescription);
                }}
                className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-colors"
                title="In đơn thuốc"
              >
                <Printer size={18} />
              </button>
              <button
                onClick={() => {
                  downloadPrescription(prescription);
                }}
                className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-colors"
                title="Tải xuống"
              >
                <Download size={18} />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[calc(92vh-140px)] overflow-y-auto px-6 py-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic */}
            <div className="space-y-3">
              <h3 className="border-b pb-2 text-base font-semibold text-slate-900">
                Thông tin cơ bản
              </h3>
              <div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ring-1 ${getStatusColor(
                    prescription.status
                  )}`}
                >
                  {getStatusText(prescription.status)}
                </span>
              </div>
              <div>
                <div className="text-sm text-slate-600">Ngày kê đơn</div>
                <div className="font-medium">
                  {formatDate(prescription.prescriptionDate)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Bác sĩ kê đơn</div>
                <div className="font-medium">{prescription.doctor.name}</div>
                {prescription.doctor.specialty?.name && (
                  <div className="text-sm text-slate-600">
                    {prescription.doctor.specialty.name}
                  </div>
                )}
                {prescription.doctor.workplace && (
                  <div className="text-sm text-slate-600">
                    {prescription.doctor.workplace}
                  </div>
                )}
              </div>
            </div>

            {/* Medical record */}
            <div className="space-y-3">
              <h3 className="border-b pb-2 text-base font-semibold text-slate-900">
                Thông tin bệnh án
              </h3>
              {prescription.medicalRecord ? (
                <>
                  <div>
                    <div className="text-sm text-slate-600">Chẩn đoán</div>
                    <div className="font-medium">
                      {prescription.medicalRecord.diagnosis}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Loại khám</div>
                    <div className="capitalize">
                      {prescription.medicalRecord.consultationType === "online"
                        ? "Trực tuyến"
                        : "Tại phòng khám"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Ngày khám</div>
                    <div>
                      {formatDate(prescription.medicalRecord.createdAt)}
                    </div>
                  </div>
                </>
              ) : (
                <p className="italic text-slate-500">
                  Không có thông tin bệnh án
                </p>
              )}
            </div>
          </div>

          {/* Med list */}
          <div className="mt-6">
            <h3 className="mb-3 border-b pb-2 text-base font-semibold text-slate-900">
              Danh sách thuốc ({prescription.medications.length} loại)
            </h3>
            <div className="space-y-3">
              {prescription.medications.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <div className="mb-1 font-semibold text-gray-900">
                        {m.name}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Hàm lượng:</span>{" "}
                          {m.strength}
                        </div>
                        <div>
                          <span className="font-medium">Dạng thuốc:</span>{" "}
                          {m.form}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Liều dùng:</span>{" "}
                        {m.dosage}
                      </div>
                      <div>
                        <span className="font-medium">Tần suất:</span>{" "}
                        {m.frequency} lần/ngày
                      </div>
                      <div>
                        <span className="font-medium">Thời gian:</span>{" "}
                        {m.duration} ngày
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Số lượng:</span>{" "}
                        {m.quantity}
                      </div>
                      {m.instructions && (
                        <div>
                          <span className="font-medium">Hướng dẫn:</span>{" "}
                          <span className="italic text-blue-700">
                            {m.instructions}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {prescription.notes && (
            <div className="mt-6">
              <h3 className="mb-3 border-b pb-2 text-base font-semibold text-gray-900">
                Ghi chú
              </h3>
              <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800 border border-yellow-200">
                {prescription.notes}
              </div>
            </div>
          )}
        </div>

        {/* Clean Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => printPrescription(prescription)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              <Printer size={16} />
              In đơn thuốc
            </button>
            <button
              onClick={() => downloadPrescription(prescription)}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition-colors"
            >
              <Download size={16} />
              Tải xuống
            </button>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionsPage;
