import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getDoctorById, getDoctors } from "../../../api/doctorsApi";

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const data = await getDoctorById(id);
        setDoctor(data);
        if (data?.specialty) {
          try {
            const list = await getDoctors(data.specialty);
            setRelated(
              (list || [])
                .filter((d: any) => String(d._id) !== String(id))
                .slice(0, 6)
            );
          } catch {
            setRelated([]);
          }
        } else {
          setRelated([]);
        }
      } catch {
        setError("Không tải được thông tin bác sĩ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-32">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100 px-12 py-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                </div>
                <span className="text-blue-700 font-semibold text-lg">
                  Đang tải thông tin...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
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
            Quay lại
          </button>

          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-3xl p-8 max-w-md mx-auto mt-32 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-red-700 text-lg font-medium">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm hover:bg-white text-blue-600 hover:text-blue-800 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-100 group"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:-translate-x-1"
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
            <span className="font-semibold">Quay lại</span>
          </button>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Thông tin bác sĩ</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100 p-8 mb-8 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-100/30 to-transparent rounded-full translate-y-24 -translate-x-24"></div>

          <div className="relative flex flex-col md:flex-row items-start gap-8">
            {doctor.avatar ? (
              <div className="relative group">
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="w-40 h-40 rounded-3xl object-cover border-4 border-white shadow-2xl transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-lg"></div>
              </div>
            ) : (
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
                  <svg
                    className="w-20 h-20 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-lg"></div>
              </div>
            )}

            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 bg-clip-text text-transparent mb-3 leading-tight">
                  BS. {doctor.name}
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full"></div>
              </div>

              {doctor.workplace && (
                <div className="flex items-center gap-3 mb-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-xl font-medium">
                    {doctor.workplace}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 text-xl">
                  Kinh nghiệm:{" "}
                  <span className="font-bold text-teal-600">
                    {doctor.experience || 0} năm
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {doctor.description && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100 p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              Giới thiệu
            </h2>
            <div className="bg-gradient-to-r from-blue-50/30 to-teal-50/30 rounded-2xl p-6 border border-blue-100">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
                {doctor.description}
              </p>
            </div>
          </div>
        )}

        {/* Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Education */}
          {Array.isArray(doctor.education) && doctor.education.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100 p-8 hover:shadow-2xl transition-all duration-300 group">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                Học vấn
              </h3>
              <ul className="space-y-4">
                {doctor.education.map((e: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-4 p-3 bg-gradient-to-r from-blue-50/50 to-transparent rounded-xl border border-blue-100 hover:border-blue-200 transition-colors"
                  >
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                    <span className="text-gray-700 font-medium">{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Certifications */}
          {Array.isArray(doctor.certifications) &&
            doctor.certifications.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100 p-8 hover:shadow-2xl transition-all duration-300 group">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  Chứng chỉ
                </h3>
                <ul className="space-y-4">
                  {doctor.certifications.map((e: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-4 p-3 bg-gradient-to-r from-green-50/50 to-transparent rounded-xl border border-green-100 hover:border-green-200 transition-colors"
                    >
                      <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                      <span className="text-gray-700 font-medium">{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Languages */}
          {Array.isArray(doctor.languages) && doctor.languages.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100 p-8 hover:shadow-2xl transition-all duration-300 group">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                </div>
                Ngôn ngữ
              </h3>
              <div className="flex flex-wrap gap-3">
                {doctor.languages.map((l: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 text-purple-700 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="container mx-auto px-4 pb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Bác sĩ cùng chuyên khoa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((d) => (
              <Link
                to={`/doctors/${d._id}`}
                key={d._id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-4 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-4">
                  {d.avatar ? (
                    <img
                      src={d.avatar}
                      alt={d.name}
                      className="w-16 h-16 rounded-xl object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">
                      BS. {d.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {d.workplace || ""}
                    </div>
                    {typeof d.experience !== "undefined" && (
                      <div className="text-xs text-gray-500">
                        Kinh nghiệm: {d.experience} năm
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
