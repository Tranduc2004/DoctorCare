import { useEffect, useState } from "react";
import { getDoctors } from "../../../api/doctorsApi";
import { specialtyApi } from "../../../api/specialtyApi";
import { Link, useSearchParams } from "react-router-dom";

type Specialty = { _id: string; name: string };
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
  const [sortBy, setSortBy] = useState<"name" | "experience" | "rating">(
    "name"
  );
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

  // Lọc + tìm + sắp xếp
  useEffect(() => {
    let filtered = [...doctors];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((d) => d.name.toLowerCase().includes(q));
    }

    if (experienceFilter) {
      const [min, max] = experienceFilter.split("-").map(Number);
      filtered = filtered.filter((d) => {
        const exp = d.experience || 0;
        return max ? exp >= min && exp <= max : exp >= min;
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "experience":
          return (b.experience || 0) - (a.experience || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "name":
        default:
          return a.name.localeCompare(b.name, "vi");
      }
    });

    setFilteredDoctors(filtered);
  }, [doctors, searchQuery, experienceFilter, sortBy]);

  const experienceRanges = [
    { value: "", label: "Tất cả kinh nghiệm" },
    { value: "0-5", label: "0–5 năm" },
    { value: "6-10", label: "6–10 năm" },
    { value: "11-15", label: "11–15 năm" },
    { value: "16-20", label: "16–20 năm" },
    { value: "21", label: "Trên 20 năm" },
  ];

  const sortOptions = [
    { value: "name", label: "Tên A–Z" },
    { value: "experience", label: "Kinh nghiệm" },
    { value: "rating", label: "Đánh giá cao nhất" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-teal-50">
      <div className="min-h-[70vh] bg-slate-50">
        <div className="bg-gradient-to-r from-blue-500 to-teal-400 text-white">
          <div className="mx-auto max-w-6xl px-4 py-8 pl-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="">
              <h1 className="text-2xl sm:text-3xl font-bold">Đội ngũ bác sĩ</h1>
              <p className="text-white/90">
                Tìm thấy {filteredDoctors.length} bác sĩ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-white/90">
                Sắp xếp
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 rounded-lg bg-white px-3 text-black text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row w-0-full max-w-7xl mx-auto px-4 py-6">
          {/* Sidebar bộ lọc */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-6 rounded-xl bg-white/80 backdrop-blur ring-1 ring-slate-200">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Bộ lọc
                </h2>
              </div>

              <div className="p-5 space-y-6">
                {/* Tìm kiếm */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tìm kiếm bác sĩ
                  </label>
                  <div className="relative">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nhập tên bác sĩ…"
                      className="h-10 w-full rounded-lg bg-white pl-9 pr-3 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                    <svg
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.2-5.2M16 10a6 6 0 11-12 0 6 6 0 0112 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Chuyên khoa */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Chuyên khoa
                  </label>
                  <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                    <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <input
                        type="radio"
                        name="specialty"
                        value=""
                        checked={selected === ""}
                        onChange={() => setParams({})}
                        className="h-4 w-4 accent-teal-600"
                      />
                      <span className="text-sm text-slate-700">
                        Tất cả chuyên khoa
                      </span>
                    </label>
                    {specialties.map((sp) => (
                      <label
                        key={sp._id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="specialty"
                          value={sp._id}
                          checked={selected === sp._id}
                          onChange={() => setParams({ specialty: sp._id })}
                          className="h-4 w-4 accent-teal-600"
                        />
                        <span className="text-sm text-slate-700">
                          {sp.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Kinh nghiệm */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Kinh nghiệm
                  </label>
                  <div className="space-y-1">
                    {[
                      { value: "", label: "Tất cả kinh nghiệm" },
                      { value: "0-5", label: "0–5 năm" },
                      { value: "6-10", label: "6–10 năm" },
                      { value: "11-15", label: "11–15 năm" },
                      { value: "16-20", label: "16–20 năm" },
                      { value: "21", label: "Trên 20 năm" },
                    ].map((r) => (
                      <label
                        key={r.value}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="experience"
                          value={r.value}
                          checked={experienceFilter === r.value}
                          onChange={(e) => setExperienceFilter(e.target.value)}
                          className="h-4 w-4 accent-teal-600"
                        />
                        <span className="text-sm text-slate-700">
                          {r.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear */}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setExperienceFilter("");
                    setSortBy("name");
                    setParams({});
                  }}
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </aside>

          {/* Danh sách bác sĩ */}
          <main className="flex-1">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="rounded-lg bg-white/80 px-6 py-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                    <span className="text-slate-700">Đang tải…</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg bg-rose-50 p-4 text-rose-700 ring-1 ring-rose-200">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {filteredDoctors.length === 0 ? (
                  <div className="mx-auto max-w-md rounded-xl bg-white/80 p-8 text-center text-slate-600 ring-1 ring-slate-200">
                    Không tìm thấy bác sĩ phù hợp tiêu chí.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {filteredDoctors.map((d) => (
                      <li
                        key={d._id}
                        className="rounded-xl bg-white/80 p-5 ring-1 ring-slate-200 transition hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-5 md:flex-row">
                          {/* Avatar */}
                          <div className="shrink-0">
                            {d.avatar ? (
                              <img
                                src={d.avatar}
                                alt={d.name}
                                className="h-24 w-24 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                                <svg
                                  className="h-10 w-10"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
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

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h3 className="truncate text-xl font-semibold text-slate-900">
                                  BS. {d.name}
                                </h3>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                                  {d.workplace && <span>{d.workplace}</span>}
                                  <span>
                                    • Kinh nghiệm: {d.experience || 0} năm
                                  </span>
                                  {typeof d.rating === "number" && (
                                    <span>• Đánh giá: {d.rating}/5</span>
                                  )}
                                  {typeof d.consultationCount === "number" && (
                                    <span>
                                      • {d.consultationCount} lượt khám
                                    </span>
                                  )}
                                </div>

                                {d.specialties && d.specialties.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {d.specialties.slice(0, 4).map((s, i) => (
                                      <span
                                        key={i}
                                        className="rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
                                      >
                                        {s}
                                      </span>
                                    ))}
                                    {d.specialties.length > 4 && (
                                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                                        +{d.specialties.length - 4} nữa
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 md:ml-4">
                                <Link
                                  to={`/alldoctors/${d._id}`}
                                  className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-3 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                                  title="Xem chi tiết"
                                >
                                  Xem chi tiết
                                </Link>
                                <Link
                                  to={`/appointment?doctorId=${d._id}`}
                                  className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-teal-400 px-3 text-sm font-medium text-white hover:bg-teal-700"
                                  title="Đặt lịch khám"
                                >
                                  Đặt lịch
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
