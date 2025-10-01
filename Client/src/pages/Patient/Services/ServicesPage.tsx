import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { serviceApi } from "../../../api/serviceApi";

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
}

const formatPrice = (price: number) =>
  price > 0
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price)
    : "Liên hệ";

const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const StethoIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 8v4a4 4 0 008 0V7M6 8a2 2 0 11-4 0 2 2 0 014 0zm8 3h0M18 7a3 3 0 013 3v1a5 5 0 01-10 0V7"
    />
  </svg>
);

const SkeletonCard = () => (
  <div className="bg-white/70 backdrop-blur border border-blue-100 rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="h-4 w-24 bg-slate-200 rounded mb-3" />
    <div className="h-6 w-3/4 bg-slate-200 rounded mb-2" />
    <div className="h-4 w-full bg-slate-100 rounded mb-2" />
    <div className="h-4 w-2/3 bg-slate-100 rounded mb-6" />
    <div className="flex items-center justify-between">
      <div className="h-6 w-28 bg-slate-200 rounded" />
      <div className="h-6 w-20 bg-slate-200 rounded" />
    </div>
    <div className="h-10 w-full bg-slate-200 rounded mt-4" />
  </div>
);

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "price_asc" | "price_desc" | "duration"
  >("name");

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serviceApi.getActiveServices();
      const mapped: Service[] = (data || []).map((s: any) => ({
        _id: s._id,
        name: s.name,
        description: s.description,
        price: s.price,
        duration: s.duration ?? 30,
        isActive: s.isActive,
      }));
      setServices(mapped);
      setError(null);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = services.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
    );

    switch (sortBy) {
      case "price_asc":
        list = list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list = list.sort((a, b) => b.price - a.price);
        break;
      case "duration":
        list = list.sort((a, b) => a.duration - b.duration);
        break;
      case "name":
      default:
        list = list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }
    return list;
  }, [services, search, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2 ring-1 ring-white/30">
              <StethoIcon className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Dịch vụ y tế
            </h1>
          </div>
          <p className="mt-2 text-white/90">
            Chọn dịch vụ phù hợp – đặt lịch nhanh chóng, minh bạch chi phí.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên/mô tả dịch vụ..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 10-14 0 7 7 0 0014 0z"
                />
              </svg>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="name">Tên A–Z</option>
                <option value="price_asc">Giá: Thấp → Cao</option>
                <option value="price_desc">Giá: Cao → Thấp</option>
                <option value="duration">Thời gian (ngắn → dài)</option>
              </select>
            </div>

            <div className="hidden md:block text-sm text-slate-600">
              Tổng: <span className="font-semibold">{filtered.length}</span>{" "}
              dịch vụ
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
              <h3 className="text-rose-700 font-semibold text-lg mb-1">
                Không thể tải dịch vụ
              </h3>
              <p className="text-rose-600 mb-4">{error}</p>
              <button
                onClick={fetchServices}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:from-blue-700 hover:to-teal-600 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v6h6M20 20v-6h-6M20 4l-6 6M4 20l6-6"
                  />
                </svg>
                Thử lại
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-blue-100 p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 border border-blue-200 mx-auto flex items-center justify-center mb-3">
                <StethoIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Không tìm thấy dịch vụ
              </h3>
              <p className="text-slate-600 mt-1">
                Hãy thử từ khóa khác hoặc xem lại sau.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((service) => (
              <div
                key={service._id}
                className="group bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 text-blue-600">
                        <StethoIcon />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {service.name}
                      </h2>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${
                        service.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {service.isActive ? "Đang cung cấp" : "Tạm dừng"}
                    </span>
                  </div>

                  <p className="text-slate-600 mb-4 line-clamp-3">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-blue-700 font-extrabold text-xl">
                      {formatPrice(service.price)}
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-sm">
                      <ClockIcon />
                      <span>{service.duration} phút</span>
                    </div>
                  </div>

                  <Link
                    to={`/services/${service._id}`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-medium hover:from-blue-700 hover:to-teal-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition-all"
                  >
                    Xem chi tiết
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
