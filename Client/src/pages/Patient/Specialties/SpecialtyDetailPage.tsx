import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { specialtyApi } from "../../../api/specialtyApi";

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  imagePublicId?: string;
}

// Component để format mô tả với xuống hàng phù hợp
const FormattedDescription: React.FC<{ description: string }> = ({
  description,
}) => {
  const formatText = (text: string) => {
    // Tách text thành các câu dựa trên dấu chấm, tránh tách ở số thập phân
    const sentences = text
      .split(/(?<!\d)\.(?!\d)\s*/)
      .filter((s) => s.trim().length > 0);

    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim();

      // Kiểm tra nếu câu là item trong danh sách
      if (
        trimmedSentence.match(/^[•-]\s/) ||
        trimmedSentence.match(
          /^(Chuyên|Điều trị|Khám|Tầm soát|Phẫu thuật|Thăm khám|Tư vấn)/
        )
      ) {
        currentList.push(trimmedSentence);
      } else {
        // Nếu có list đang tích lũy, render nó trước
        if (currentList.length > 0) {
          elements.push(
            <ul
              key={`list-${index}`}
              className="list-disc list-inside space-y-2 mb-6 ml-4"
            >
              {currentList.map((item, listIndex) => (
                <li key={listIndex} className="text-gray-700 leading-relaxed">
                  {item.replace(/^[•-]\s*/, "")}
                </li>
              ))}
            </ul>
          );
          currentList = [];
        }

        // Kiểm tra nếu câu là tiêu đề
        if (
          trimmedSentence.length < 80 &&
          (trimmedSentence.includes("Chuyên khoa") ||
            trimmedSentence.includes("chuyên về"))
        ) {
          elements.push(
            <h4
              key={index}
              className="font-semibold text-emerald-800 mt-8 mb-4 text-xl border-l-4 border-emerald-500 pl-4"
            >
              {trimmedSentence}
            </h4>
          );
        } else if (trimmedSentence.length > 0) {
          // Đoạn văn bình thường
          elements.push(
            <p
              key={index}
              className="mb-4 leading-relaxed text-gray-700 text-lg"
            >
              {trimmedSentence}
              {trimmedSentence.endsWith(".") ? "" : "."}
            </p>
          );
        }
      }
    });

    // Render list cuối cùng nếu có
    if (currentList.length > 0) {
      elements.push(
        <ul
          key="final-list"
          className="list-disc list-inside space-y-2 mb-6 ml-4"
        >
          {currentList.map((item, listIndex) => (
            <li key={listIndex} className="text-gray-700 leading-relaxed">
              {item.replace(/^[•-]\s*/, "")}
            </li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className="formatted-description space-y-4">
      {formatText(description)}
    </div>
  );
};

const SpecialtyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecialtyDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await specialtyApi.getSpecialtyById(id);
        setSpecialty({
          _id: data._id,
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
          imagePublicId: data.imagePublicId,
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching specialty details:", err);
        setError("Không thể tải thông tin chuyên khoa. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialtyDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error || !specialty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">
            {error || "Không tìm thấy chuyên khoa"}
          </span>
        </div>
        <div className="mt-4">
          <Link to="/specialties" className="text-teal-500 hover:underline">
            &larr; Quay lại danh sách chuyên khoa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      {/* Navigation Bar */}
      <div className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-emerald-600 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </Link>
              <span>/</span>
              <Link
                to="/specialties"
                className="hover:text-emerald-600 transition-colors"
              >
                Chuyên khoa
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">
                {specialty.name}
              </span>
            </nav>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Quay lại</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section với ảnh nền */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          {specialty.imageUrl ? (
            <img
              src={specialty.imageUrl}
              alt={specialty.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600"></div>
          )}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white mb-6">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Chuyên Khoa Y Tế
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                {specialty.name}
              </h1>

              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Chuyên khoa với đội ngũ bác sĩ giàu kinh nghiệm, trang thiết bị
                hiện đại và phương pháp điều trị tiên tiến
              </p>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg hover:bg-white transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-gray-600">Đặt lịch khám</p>
                      <p className="text-lg font-bold text-gray-900">
                        Nhanh chóng
                      </p>
                    </div>
                  </div>
                </button>

                <button className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg hover:bg-white transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-gray-600">Tư vấn</p>
                      <p className="text-lg font-bold text-gray-900">
                        Trực tuyến
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Content Column */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
                <div className="prose prose-lg max-w-none">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    Thông Tin Chuyên Khoa
                  </h2>

                  <div className="text-gray-700 leading-relaxed space-y-4">
                    <div className="text-lg">
                      {specialty.description ? (
                        <FormattedDescription
                          description={specialty.description}
                        />
                      ) : (
                        <p className="text-gray-500 italic">
                          Không có mô tả chi tiết cho chuyên khoa này.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specialty Features Grid */}
                <div className="mt-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8">
                    Dịch Vụ Chuyên Khoa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Chẩn Đoán Chính Xác
                        </h4>
                        <p className="text-gray-600">
                          Sử dụng công nghệ hiện đại và kinh nghiệm lâm sàng
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Điều Trị Hiệu Quả
                        </h4>
                        <p className="text-gray-600">
                          Phương pháp điều trị tiên tiến, an toàn và hiệu quả
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Đội Ngũ Chuyên Gia
                        </h4>
                        <p className="text-gray-600">
                          Bác sĩ chuyên khoa giàu kinh nghiệm và tận tâm
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-orange-600"
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
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Theo Dõi Liên Tục
                        </h4>
                        <p className="text-gray-600">
                          Chăm sóc sau điều trị và theo dõi sức khỏe định kỳ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                {/* Contact Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Liên Hệ Chuyên Khoa
                  </h3>

                  <div className="space-y-6">
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                      Đặt Lịch Khám
                    </button>

                    <button className="w-full bg-white border-2 border-emerald-500 text-emerald-600 py-4 rounded-2xl font-semibold text-lg hover:bg-emerald-50 transition-all duration-300">
                      Tư Vấn Trực Tuyến
                    </button>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-xl p-8 text-white">
                  <h3 className="text-xl font-bold mb-6 text-center">
                    Cần Hỗ Trợ?
                  </h3>

                  <div className="space-y-4">
                    <a
                      href="tel:+84123456789"
                      className="flex items-center justify-center space-x-3 bg-white/20 backdrop-blur-sm rounded-2xl py-3 px-4 hover:bg-white/30 transition-colors"
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
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="font-medium">Gọi Hotline</span>
                    </a>

                    <a
                      href="/lien-he"
                      className="flex items-center justify-center space-x-3 bg-white/20 backdrop-blur-sm rounded-2xl py-3 px-4 hover:bg-white/30 transition-colors"
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="font-medium">Chat Tư Vấn</span>
                    </a>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/20 text-center text-sm text-white/80">
                    📍 Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM
                    <br />
                    🕒 Giờ làm việc: 8:00 - 17:00 (T2-T7)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialtyDetailPage;
