import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { specialtyApi, ISpecialty } from "../../../api/specialtyApi";
import * as Lucide from "lucide-react";

type Specialty = {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  iconKey?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  imagePublicId?: string;
};

const SpecialtyIcon: React.FC<{ specialty: Specialty; className?: string }> = ({
  specialty,
  className = "h-10 w-10",
}) => {
  if (specialty.thumbnailUrl) {
    return (
      <div className={`${className} rounded-lg overflow-hidden shadow-sm`}>
        <img
          src={specialty.thumbnailUrl}
          alt={specialty.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback to icon if no image
  const IconComp =
    specialty.iconKey &&
    typeof (Lucide as unknown as Record<string, React.ElementType>)[
      specialty.iconKey
    ] === "function"
      ? (Lucide as unknown as Record<string, React.ElementType>)[
          specialty.iconKey
        ]
      : undefined;
  return (
    <div
      className={`${className} rounded-lg bg-gradient-to-b from-teal-200 to-teal-400 text-white grid place-items-center shadow-sm`}
    >
      {IconComp ? (
        <IconComp className="h-5 w-5" />
      ) : (
        // fallback placeholder
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2"
          />
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
    </div>
  );
};

export default function SpecialtiesGridPage() {
  const [items, setItems] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Hiển thị 6 chuyên khoa mỗi trang

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await specialtyApi.getActiveSpecialties();
      const list: Specialty[] = (data || []).map((s: ISpecialty) => ({
        _id: s._id,
        name: s.name,
        description: s.description,
        isActive: s.isActive,
        imageUrl: s.imageUrl,
        thumbnailUrl: s.thumbnailUrl,
        imagePublicId: s.imagePublicId,
      }));
      setItems(list);
    } catch {
      setErr("Không thể tải danh sách chuyên khoa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedItems = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [items]
  );

  // Phân trang
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visible = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top khi đổi trang
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner Section - giống như trang services */}
      <div className="relative bg-teal-500 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-white">
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  CHUYÊN KHOA Y TẾ
                </h1>
                <p className="text-xl lg:text-2xl mb-8 text-emerald-100 leading-relaxed">
                  Đội ngũ chuyên gia y tế hàng đầu với các chuyên khoa đa dạng
                </p>

                {/* Contact Info */}
                <div className="mb-8">
                  <p className="text-lg mb-4 text-emerald-100">
                    Liên hệ{" "}
                    <span className="font-bold text-white">chuyên gia</span> để
                    được tư vấn chuyên sâu
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
                      <span className="text-emerald-100">hoặc</span>
                    </div>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-full transition-colors duration-300 shadow-lg">
                      Chat ngay
                    </button>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Khám phá chuyên khoa
                </button>
              </div>

              {/* Right Content - Medical Specialties Visual */}
              <div className="relative">
                <div className="flex justify-center lg:justify-end">
                  <div className="relative">
                    {/* Background decorative elements */}
                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-300/20 rounded-full blur-xl"></div>

                    {/* Medical specialties grid */}
                    <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Cardiology */}
                        <div className="bg-gradient-to-br from-red-200 to-red-400 rounded-xl p-4 shadow-lg">
                          <svg
                            className="w-8 h-8 text-white mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <p className="text-white text-sm font-medium">
                            Tim mạch
                          </p>
                        </div>

                        {/* Neurology */}
                        <div className="bg-gradient-to-br from-purple-200 to-purple-400 rounded-xl p-4 shadow-lg">
                          <svg
                            className="w-8 h-8 text-white mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          <p className="text-white text-sm font-medium">
                            Thần kinh
                          </p>
                        </div>

                        {/* Orthopedics */}
                        <div className="bg-gradient-to-br from-blue-200 to-blue-400 rounded-xl p-4 shadow-lg">
                          <svg
                            className="w-8 h-8 text-white mb-2"
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
                          <p className="text-white text-sm font-medium">
                            Xương khớp
                          </p>
                        </div>

                        {/* Pediatrics */}
                        <div className="bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-xl p-4 shadow-lg">
                          <svg
                            className="w-8 h-8 text-white mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 001.5-1.5V8a5 5 0 00-10 0v1A1.5 1.5 0 003.5 10H5m14 0h-1.5a1.5 1.5 0 01-1.5-1.5V8a5 5 0 0110 0v1a1.5 1.5 0 01-1.5 1.5H19m-5 4v6"
                            />
                          </svg>
                          <p className="text-white text-sm font-medium">
                            Nhi khoa
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 text-center">
                        <p className="text-white font-semibold">
                          Chuyên Khoa Đa Dạng
                        </p>
                        <p className="text-emerald-100 text-sm">
                          Phục vụ mọi nhu cầu chăm sóc sức khỏe
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

      {/* Content Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Danh Sách Chuyên Khoa
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Khám phá các chuyên khoa y tế với đội ngũ bác sĩ chuyên môn cao,
              trang thiết bị hiện đại và dịch vụ chăm sóc tận tâm
            </p>
          </div>
          {err && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700 shadow-sm">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                {err}
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse"
                >
                  <div className="flex">
                    <div className="flex-1">
                      <div className="h-6 w-3/4 rounded bg-gray-200 mb-4" />
                      <div className="space-y-2 mb-4">
                        <div className="h-3 w-full rounded bg-gray-100" />
                        <div className="h-3 w-4/5 rounded bg-gray-100" />
                        <div className="h-3 w-3/5 rounded bg-gray-100" />
                      </div>
                      <div className="h-4 w-24 rounded bg-gray-200" />
                    </div>
                    <div className="w-48 h-40 ml-6 rounded-lg bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có chuyên khoa nào
              </h3>
              <p className="text-gray-600">
                Danh sách chuyên khoa đang được cập nhật.
              </p>
            </div>
          ) : (
            <>
              {/* Danh sách chuyên khoa */}
              <div className="space-y-6">
                {visible.map((specialty) => (
                  <SpecialtyCard key={specialty._id} specialty={specialty} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <div className="flex items-center space-x-2">
                    {/* Previous button */}
                    <button
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                            currentPage === page
                              ? "bg-teal-500 text-white shadow-md"
                              : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    {/* Next button */}
                    <button
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-teal-500 hover:text-teal-600 hover:bg-emerald-50"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
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
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination info */}
              {sortedItems.length > 0 && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Hiển thị {startIndex + 1}-
                    {Math.min(startIndex + itemsPerPage, sortedItems.length)}{" "}
                    trong số {sortedItems.length} chuyên khoa
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Specialty Card Component
const SpecialtyCard: React.FC<{ specialty: Specialty }> = ({ specialty }) => {
  return (
    <Link
      to={`/specialties/${specialty._id}`}
      className="group block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
    >
      <div className="flex">
        {/* Content */}
        <div className="flex-1 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
            {specialty.name}
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3 text-sm">
            {specialty.description ||
              "Thông tin chuyên khoa đang được cập nhật."}
          </p>
          <div className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors duration-200">
            Tìm hiểu thêm
            <svg
              className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300"
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
          </div>
        </div>

        {/* Image */}
        <div className="relative w-48 h-40 flex-shrink-0">
          {specialty.thumbnailUrl || specialty.imageUrl ? (
            <img
              src={specialty.thumbnailUrl || specialty.imageUrl}
              alt={specialty.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
              <div className="text-center">
                <SpecialtyIcon
                  specialty={specialty}
                  className="h-12 w-12 mx-auto mb-2"
                />
                <p className="text-emerald-600 font-medium text-xs">
                  Chuyên Khoa
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
