import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  getPayments,
  getPaymentById,
  type Payment,
} from "../../api/paymentApi";

const PaymentsPage: React.FC = () => {
  const { admin, isAuthenticated, initialized } = useAdminAuth();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const loadPayments = async (page: number = 1) => {
    setLoading(true);
    setError("");

    try {
      const filters = {
        page,
        limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
        paymentMethod: methodFilter !== "all" ? methodFilter : undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        search: searchQuery.trim() || undefined,
      };

      const response = await getPayments(filters);
      console.log("Payment data:", response.payments);
      setPayments(response.payments);
      setCurrentPage(response.pagination.current);
      setTotalPages(response.pagination.total);
      setTotalCount(response.pagination.count);
    } catch (err) {
      console.error("Error loading payments:", err);
      setError("Không thể tải danh sách thanh toán. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setCurrentPage(1);
    loadPayments(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "captured":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case "pending":
        return "bg-blue-50 text-blue-700 ring-blue-200";
      case "failed":
        return "bg-rose-50 text-rose-700 ring-rose-200";
      case "refunded":
        return "bg-amber-50 text-amber-700 ring-amber-200";
      case "authorized":
        return "bg-purple-50 text-purple-700 ring-purple-200";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "captured":
        return <CheckCircle size={14} className="text-emerald-600" />;
      case "pending":
        return <Clock size={14} className="text-blue-600" />;
      case "failed":
        return <XCircle size={14} className="text-rose-600" />;
      case "refunded":
        return <RefreshCw size={14} className="text-amber-600" />;
      case "authorized":
        return <Clock size={14} className="text-purple-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "captured":
        return "Thành công";
      case "pending":
        return "Đang xử lý";
      case "failed":
        return "Thất bại";
      case "refunded":
        return "Đã hoàn tiền";
      case "authorized":
        return "Đã xác thực";
      default:
        return status;
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case "payos":
        return "PayOS";
      case "vnpay":
        return "VNPay";
      default:
        return method;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /* Loading skeleton */
  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#F8F9FD] to-white p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-blue-500/20 bg-white/70 p-6 shadow-sm backdrop-blur">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F8F9FD] to-white p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-blue-500/20 bg-white/70 shadow-sm backdrop-blur">
          <div className="px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="rounded-xl bg-purple-500 p-3">
                  <CreditCard size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Quản lý thanh toán
                  </h1>
                  <p className="mt-1 text-gray-600">
                    Theo dõi và quản lý các giao dịch thanh toán
                  </p>
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 px-6 py-4">
                  <div className="text-sm text-gray-600 mb-1">Xin chào</div>
                  <div className="font-medium text-gray-900">
                    {admin?.username || "Admin"}
                  </div>
                </div>
                <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 px-6 py-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalCount}
                    </div>
                    <div className="text-sm text-gray-600">Tổng giao dịch</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filters */}
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
                    placeholder="Tìm kiếm theo mã giao dịch, tên bệnh nhân..."
                    className="w-full rounded-xl border border-blue-500/20 bg-white pl-12 pr-4 py-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="rounded-xl bg-purple-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                >
                  <Search size={18} className="inline mr-2" />
                  Tìm kiếm
                </button>
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="inline-flex items-center gap-3 rounded-xl border border-blue-500/20 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50/50 transition-colors"
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
                <div className="rounded-xl border border-blue-500/20 bg-blue-50/30 p-6 backdrop-blur">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Status Filter */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Trạng thái thanh toán
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "all", label: "Tất cả" },
                          { value: "captured", label: "Thành công" },
                          { value: "pending", label: "Đang xử lý" },
                          { value: "failed", label: "Thất bại" },
                          { value: "refunded", label: "Đã hoàn tiền" },
                          { value: "authorized", label: "Đã xác thực" },
                        ].map((status) => (
                          <button
                            key={status.value}
                            onClick={() => setStatusFilter(status.value)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                              statusFilter === status.value
                                ? "bg-purple-500 text-white"
                                : "bg-white text-gray-700 hover:bg-blue-50/50"
                            } transition-colors`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method Filter */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Phương thức thanh toán
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "all", label: "Tất cả" },
                          { value: "payos", label: "PayOS" },
                          { value: "vnpay", label: "VNPay" },
                        ].map((method) => (
                          <button
                            key={method.value}
                            onClick={() => setMethodFilter(method.value)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                              methodFilter === method.value
                                ? "bg-purple-500 text-white"
                                : "bg-white text-gray-700 hover:bg-blue-50/50"
                            } transition-colors`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Khoảng thời gian
                      </label>
                      <div className="flex flex-wrap items-center gap-4">
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) =>
                            setDateRange((d) => ({
                              ...d,
                              startDate: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-blue-500/20 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="text-gray-500">đến</span>
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) =>
                            setDateRange((d) => ({
                              ...d,
                              endDate: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-blue-500/20 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          onClick={handleSearch}
                          className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
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

        {/* Payments List */}
        <div className="overflow-hidden rounded-2xl border border-blue-500/20 bg-white/70 shadow-sm backdrop-blur">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Mã giao dịch
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Người thanh toán
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Số tiền
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Phương thức
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {payment.transactionId || payment._id.slice(-8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {payment.patientId?.name ||
                          payment.patientId?.fullName ||
                          "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.patientId?.phone || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.patientId?.email || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">
                        {getMethodText(payment.paymentMethod)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium ring-1 ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {getStatusIcon(payment.status)}
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.createdAt)}
                      </div>
                      {payment.status === "refunded" &&
                        payment.refundReason && (
                          <div className="mt-1 text-sm text-red-600">
                            Lý do: {payment.refundReason}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          try {
                            const paymentDetail = await getPaymentById(
                              payment._id
                            );
                            // TODO: Show payment detail modal
                            console.log("Payment detail:", paymentDetail);
                          } catch (err) {
                            console.error("Error loading payment detail:", err);
                            setError(
                              "Không thể tải chi tiết thanh toán. Vui lòng thử lại."
                            );
                          }
                        }}
                        className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-6 py-4">
              <div className="text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {payments.length > 0 ? (currentPage - 1) * limit + 1 : 0}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-gray-900">
                  {payments.length > 0
                    ? Math.min(currentPage * limit, totalCount)
                    : 0}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-semibold text-gray-900">
                  {totalCount}
                </span>{" "}
                giao dịch
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadPayments(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-blue-500/20 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  Trước
                </button>
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => loadPayments(1)}
                      className="rounded-lg border border-blue-500/20 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50/50 transition-colors"
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="mx-2">...</span>}
                  </>
                )}

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return false;
                    return Math.abs(page - currentPage) <= 1;
                  })
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => loadPayments(page)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "border-blue-500 bg-purple-500 text-white"
                          : "border-blue-500/20 bg-white text-gray-700 hover:bg-blue-50/50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="mx-2">...</span>
                    )}
                    <button
                      onClick={() => loadPayments(totalPages)}
                      className="rounded-lg border border-blue-500/20 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50/50 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => loadPayments(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-blue-500/20 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
