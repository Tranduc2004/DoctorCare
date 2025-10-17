import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./services.css";
import { Link } from "react-router-dom";
import { serviceApi, IService } from "../../../api/serviceApi";

type Service = {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  price?: number;
  duration?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  imagePublicId?: string;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await serviceApi.getActiveServices();
      const list: Service[] = (data || []).map((s: IService) => ({
        _id: s._id,
        name: s.name,
        description: s.description,
        isActive: s.isActive,
        price: s.price,
        duration: s.duration,
        imageUrl: s.imageUrl,
        thumbnailUrl: s.thumbnailUrl,
        imagePublicId: s.imagePublicId,
      }));
      setServices(list);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      setErr("Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // simple hook to trigger reveal when elements enter viewport
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".service-reveal"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el, i) => {
      // set a small stagger delay
      (el as HTMLElement).style.setProperty("--delay", `${i * 80}ms`);
      io.observe(el);
    });

    return () => io.disconnect();
  }, [services]);

  const visible = useMemo(
    () => services.sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [services]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-12"></div>
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-8">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{err}</p>
          </div>
        </div>
      </div>
    );
  }

  // Group services by category
  const generalServices = visible.filter(
    (s) =>
      s.name.toLowerCase().includes("khám") ||
      s.name.toLowerCase().includes("tổng quát") ||
      s.name.toLowerCase().includes("routine") ||
      s.name.toLowerCase().includes("check")
  );

  const vaccineServices = visible.filter(
    (s) =>
      s.name.toLowerCase().includes("tiêm") ||
      s.name.toLowerCase().includes("vaccine") ||
      s.name.toLowerCase().includes("vaccination")
  );

  const specialistServices = visible.filter(
    (s) => !generalServices.includes(s) && !vaccineServices.includes(s)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner Section - giống như hình */}
      <div className="relative bg-teal-500 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-white">
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  DỊCH VỤ Y TẾ TOÀN DIỆN
                </h1>
                <p className="text-xl lg:text-2xl mb-8 text-blue-100 leading-relaxed">
                  Khám phá và tận hưởng sự tiện lợi của dịch vụ y tế tại
                  MediCare
                </p>

                {/* Contact Info */}
                <div className="mb-8">
                  <p className="text-lg mb-4 text-blue-100">
                    Liên hệ{" "}
                    <span className="font-bold text-white">chuyên gia</span> để
                    tư vấn thêm
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <span className="text-2xl font-bold text-white">
                        19002115
                      </span>
                      <span className="text-blue-100">hoặc</span>
                    </div>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-full transition-colors duration-300 shadow-lg">
                      Chat ngay
                    </button>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-8 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Xem thêm
                </button>
              </div>

              {/* Right Content - Doctor Images */}
              <div className="relative hero-float">
                <div className="flex justify-center lg:justify-end">
                  <div className="relative">
                    {/* Background decorative elements */}
                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-cyan-300/20 rounded-full blur-xl"></div>

                    {/* Doctor image placeholder - replace with actual images */}
                    <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl service-reveal service-image-hover">
                      <div className="flex items-center space-x-4">
                        {/* Female Doctor */}
                        <div className="w-24 h-24 bg-gradient-to-br from-pink-200 to-purple-300 rounded-full flex items-center justify-center shadow-lg">
                          <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>

                        {/* Male Doctor */}
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-cyan-300 rounded-full flex items-center justify-center shadow-lg">
                          <svg
                            className="w-16 h-16 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="mt-6 text-center service-reveal">
                        <p className="text-white font-semibold">
                          Đội Ngũ Bác Sĩ
                        </p>
                        <p className="text-blue-100 text-sm">
                          Chuyên nghiệp & Giàu kinh nghiệm
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-12 text-gray-50"
            fill="currentColor"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
          </svg>
        </div>
      </div>

      {/* Services Content Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* General Practice Section */}
          {generalServices.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Khám Tổng Quát
              </h2>
              <div className="space-y-8">
                {generalServices.map((service, idx) => {
                  const style: React.CSSProperties = {
                    ["--delay" as unknown as string]: `${idx * 60}ms`,
                  };
                  return (
                    <div
                      key={service._id}
                      className="service-reveal"
                      style={style}
                    >
                      <ServiceCard service={service} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vaccination Section */}
          {vaccineServices.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Tiêm Chủng
              </h2>
              <div className="space-y-8">
                {vaccineServices.map((service, idx) => {
                  const style: React.CSSProperties = {
                    ["--delay" as unknown as string]: `${idx * 60}ms`,
                  };
                  return (
                    <div
                      key={service._id}
                      className="service-reveal"
                      style={style}
                    >
                      <ServiceCard service={service} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specialist Care Section */}
          {specialistServices.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Chăm Sóc Chuyên Khoa
              </h2>
              <div className="space-y-8">
                {specialistServices.map((service, idx) => {
                  const style: React.CSSProperties = {
                    ["--delay" as unknown as string]: `${idx * 60}ms`,
                  };
                  return (
                    <div
                      key={service._id}
                      className="service-reveal"
                      style={style}
                    >
                      <ServiceCard service={service} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {visible.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Chưa có dịch vụ nào được cung cấp.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Service Card Component
const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Content */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {service.name}
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
            {service.description ||
              "Đánh giá sức khỏe toàn diện bao gồm khám thể chất và các xét nghiệm cơ bản."}
          </p>
          <Link
            to={`/services/${service._id}`}
            className="inline-flex items-center text-teal-700 hover:text-teal-500 font-medium transition-colors duration-200"
          >
            Xem Chi Tiết
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Image */}
        <div className="relative h-64 lg:h-auto">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-teal-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-teal-600 font-medium">Dịch Vụ Y Tế</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
