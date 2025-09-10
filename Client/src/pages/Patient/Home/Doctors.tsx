import { useEffect, useState } from "react";
import { getDoctors } from "../../../api/doctorsApi";
import { specialtyApi } from "../../../api/specialtyApi";
import { Link, useSearchParams } from "react-router-dom";

type Specialty = {
  _id: string;
  name: string;
};

type Doctor = {
  _id: string;
  name: string;
  avatar?: string;
  workplace?: string;
  experience?: number;
  specialties?: string[];
  rating?: number;
  consultationCount?: number;
};

export default function DoctorsPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [params, setParams] = useSearchParams();
  const selected = params.get("specialty") || "";

  useEffect(() => {
    specialtyApi
      .getActiveSpecialties()
      .then((data) => setSpecialties(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getDoctors(selected || undefined);
        setDoctors(data || []);
      } catch {
        setError("Không tải được danh sách bác sĩ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selected]);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...doctors];

    // Search by name
    if (searchQuery) {
      filtered = filtered.filter((doctor) =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by experience
    if (experienceFilter) {
      const [min, max] = experienceFilter.split("-").map(Number);
      filtered = filtered.filter((doctor) => {
        const exp = doctor.experience || 0;
        if (max) return exp >= min && exp <= max;
        return exp >= min;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "experience":
          return (b.experience || 0) - (a.experience || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredDoctors(filtered);
  }, [doctors, searchQuery, experienceFilter, sortBy]);

  const experienceRanges = [
    { value: "", label: "Tất cả kinh nghiệm" },
    { value: "0-5", label: "0-5 năm" },
    { value: "6-10", label: "6-10 năm" },
    { value: "11-15", label: "11-15 năm" },
    { value: "16-20", label: "16-20 năm" },
    { value: "21", label: "Trên 20 năm" },
  ];

  const sortOptions = [
    { value: "name", label: "Tên A-Z" },
    { value: "experience", label: "Kinh nghiệm" },
    { value: "rating", label: "Đánh giá cao nhất" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filter */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 sticky top-8">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-500 p-6 rounded-t-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Bộ lọc tìm kiếm
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tìm kiếm bác sĩ
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nhập tên bác sĩ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    />
                    <svg
                      className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Specialty Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Chuyên khoa
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors duration-200">
                      <input
                        type="radio"
                        name="specialty"
                        value=""
                        checked={selected === ""}
                        onChange={() => setParams({})}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Tất cả chuyên khoa</span>
                    </label>
                    {specialties.map((specialty) => (
                      <label
                        key={specialty._id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                      >
                        <input
                          type="radio"
                          name="specialty"
                          value={specialty._id}
                          checked={selected === specialty._id}
                          onChange={() =>
                            setParams({ specialty: specialty._id })
                          }
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{specialty.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Kinh nghiệm
                  </label>
                  <div className="space-y-2">
                    {experienceRanges.map((range) => (
                      <label
                        key={range.value}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                      >
                        <input
                          type="radio"
                          name="experience"
                          value={range.value}
                          checked={experienceFilter === range.value}
                          onChange={(e) => setExperienceFilter(e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setExperienceFilter("");
                    setSortBy("name");
                    setParams({});
                  }}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200 font-medium"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header with results and sort */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                    Đội ngũ bác sĩ
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Tìm thấy {filteredDoctors.length} bác sĩ
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Sắp xếp:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-16">
                <div className="bg-white rounded-xl shadow-sm border border-blue-100 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-600 font-medium">
                      Đang tải...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Doctors List */}
            <div className="space-y-4">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Doctor Avatar */}
                    <div className="flex-shrink-0">
                      {doctor.avatar ? (
                        <img
                          src={doctor.avatar}
                          alt={doctor.name}
                          className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-blue-100"
                        />
                      ) : (
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-blue-200 flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-blue-500"
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
                    </div>

                    {/* Doctor Info */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mb-2">
                            BS.{doctor.name}
                          </h3>

                          <div className="space-y-2 mb-4">
                            {doctor.workplace && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg
                                  className="w-4 h-4"
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
                                <span>{doctor.workplace}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-gray-600">
                              <svg
                                className="w-4 h-4"
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
                              <span>
                                Kinh nghiệm: {doctor.experience || 0} năm
                              </span>
                            </div>

                            {doctor.rating && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < Math.floor(doctor.rating || 0)
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  ({doctor.rating}/5)
                                </span>
                              </div>
                            )}
                          </div>

                          {doctor.specialties &&
                            doctor.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {doctor.specialties
                                  .slice(0, 3)
                                  .map((specialty, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium"
                                    >
                                      {specialty}
                                    </span>
                                  ))}
                                {doctor.specialties.length > 3 && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                                    +{doctor.specialties.length - 3} khác
                                  </span>
                                )}
                              </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 md:ml-4">
                          <Link
                            to={`/doctors/${doctor._id}`}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 text-center font-medium"
                          >
                            XEM CHI TIẾT
                          </Link>
                          <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2">
                            <svg
                              className="w-4 h-4"
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
                            ĐẶT LỊCH KHÁM
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {!loading && !error && filteredDoctors.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Không tìm thấy bác sĩ
                  </h3>
                  <p className="text-gray-600">
                    Không có bác sĩ nào phù hợp với tiêu chí tìm kiếm của bạn.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
