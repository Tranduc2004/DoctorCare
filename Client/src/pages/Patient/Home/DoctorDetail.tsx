import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getDoctorById, getDoctors } from "../../../api/doctorsApi";
import {
  Calendar,
  MessageSquare,
  Building2,
  GraduationCap,
  BadgeCheck,
  Languages,
  Star,
  ChevronLeft,
} from "lucide-react";

type Doctor = {
  _id: string;
  name: string;
  avatar?: string;
  specialty?: { name?: string } | string;
  workplace?: string;
  experience?: number;
  description?: string;
  education?: string[];
  certifications?: string[];
  languages?: string[];
  rating?: number; // nếu backend có
  totalReviews?: number; // nếu backend có
  patientsTreated?: number; // nếu backend có
};

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [related, setRelated] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"about" | "edu" | "lang">("about");
  const [error, setError] = useState("");

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
                .filter((d: Doctor) => String(d._id) !== String(id))
                .slice(0, 8)
            );
          } catch {
            setRelated([]);
          }
        } else setRelated([]);
      } catch {
        setError("Không tải được thông tin bác sĩ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const specText = useMemo(() => {
    if (!doctor?.specialty) return "";
    return typeof doctor.specialty === "string"
      ? doctor.specialty
      : doctor.specialty.name || "";
  }, [doctor?.specialty]);

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="container mx-auto px-4 py-10">
          <div className="grid md:grid-cols-[2fr_1fr] gap-6">
            <div className="rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-sm p-6 shadow-xl">
              <div className="h-8 w-56 rounded-lg bg-slate-100 animate-pulse mb-4" />
              <div className="h-4 w-40 rounded-lg bg-slate-100 animate-pulse mb-6" />
              <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 rounded bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-sm p-6 shadow-xl">
              <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="container mx-auto px-4 py-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-4 py-2 text-blue-700 hover:bg-white transition"
          >
            <ChevronLeft className="h-4 w-4" /> Quay lại
          </button>
          <div className="mx-auto max-w-md rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              !
            </div>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Top bar */}
      <div className="container mx-auto px-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-4 py-2 text-blue-700 hover:bg-white transition"
          >
            <ChevronLeft className="h-4 w-4" /> Quay lại
          </button>
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/70 px-3 py-1.5 text-sm text-emerald-700">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Bác sĩ khả dụng
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white/80 shadow-xl">
          {/* background shapes */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-bl from-blue-100/60 to-transparent" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-gradient-to-tr from-teal-100/60 to-transparent" />

          <div className="relative grid gap-8 p-6 md:grid-cols-[2fr_1fr] md:p-10">
            {/* Left: Main info */}
            <div>
              <div className="flex items-start gap-5">
                {/* Avatar */}
                {doctor.avatar ? (
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    className="h-28 w-28 rounded-2xl object-cover border-4 border-white shadow-2xl"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-white shadow-2xl flex items-center justify-center">
                    <svg
                      className="h-12 w-12 text-blue-500"
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

                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {specText && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-200">
                        {specText}
                      </span>
                    )}
                    {doctor.workplace && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 ring-1 ring-teal-200">
                        <Building2 className="h-4 w-4" /> {doctor.workplace}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                    BS. {doctor.name}
                  </h1>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat
                      label="Kinh nghiệm"
                      value={`${doctor.experience || 0} năm`}
                    />
                    <Stat
                      label="Đánh giá"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          {(doctor.rating ?? 4.8).toFixed(1)}
                        </span>
                      }
                    />
                    <Stat
                      label="Bệnh nhân"
                      value={`${doctor.patientsTreated ?? 500}+`}
                    />
                    <Stat
                      label="Nhận xét"
                      value={`${doctor.totalReviews ?? 120}+`}
                    />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-6 border-b border-slate-200">
                <div className="flex gap-2">
                  <TabButton
                    active={tab === "about"}
                    onClick={() => setTab("about")}
                  >
                    Giới thiệu
                  </TabButton>
                  <TabButton
                    active={tab === "edu"}
                    onClick={() => setTab("edu")}
                  >
                    Học vấn & Chứng chỉ
                  </TabButton>
                  <TabButton
                    active={tab === "lang"}
                    onClick={() => setTab("lang")}
                  >
                    Ngôn ngữ
                  </TabButton>
                </div>
              </div>

              <div className="mt-4">
                {tab === "about" && (
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/40 to-teal-50/40 p-5">
                    {doctor.description ? (
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed text-lg">
                        {doctor.description}
                      </p>
                    ) : (
                      <p className="text-slate-600">Chưa có phần giới thiệu.</p>
                    )}
                  </div>
                )}

                {tab === "edu" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <CardBlock
                      title="Học vấn"
                      icon={<GraduationCap className="h-5 w-5" />}
                      color="blue"
                    >
                      {Array.isArray(doctor.education) &&
                      doctor.education.length ? (
                        <ul className="space-y-3">
                          {doctor.education.map((e, i) => (
                            <li
                              key={i}
                              className="rounded-xl border border-blue-100 bg-white p-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                                <span className="text-slate-700">{e}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyLine text="Chưa có thông tin học vấn." />
                      )}
                    </CardBlock>

                    <CardBlock
                      title="Chứng chỉ"
                      icon={<BadgeCheck className="h-5 w-5" />}
                      color="emerald"
                    >
                      {Array.isArray(doctor.certifications) &&
                      doctor.certifications.length ? (
                        <ul className="space-y-3">
                          {doctor.certifications.map((c, i) => (
                            <li
                              key={i}
                              className="rounded-xl border border-emerald-100 bg-white p-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                                <span className="text-slate-700">{c}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyLine text="Chưa có chứng chỉ." />
                      )}
                    </CardBlock>
                  </div>
                )}

                {tab === "lang" && (
                  <CardBlock
                    title="Ngôn ngữ sử dụng"
                    icon={<Languages className="h-5 w-5" />}
                    color="purple"
                  >
                    {Array.isArray(doctor.languages) &&
                    doctor.languages.length ? (
                      <div className="flex flex-wrap gap-2">
                        {doctor.languages.map((l, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm text-purple-700"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <EmptyLine text="Chưa có thông tin ngôn ngữ." />
                    )}
                  </CardBlock>
                )}
              </div>
            </div>

            {/* Right: Booking card (sticky) */}
            <aside className="md:sticky md:top-6 h-fit">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <h3 className="mb-3 text-lg font-semibold text-slate-900">
                  Đặt lịch với BS. {doctor.name}
                </h3>
                <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                  <MiniStat
                    label="Kinh nghiệm"
                    value={`${doctor.experience || 0}y`}
                  />
                  <MiniStat
                    label="Đánh giá"
                    value={`${(doctor.rating ?? 4.8).toFixed(1)}`}
                  />
                  <MiniStat
                    label="BN đã khám"
                    value={`${doctor.patientsTreated ?? 500}+`}
                  />
                </div>
                <Link
                  to="/appointment"
                  className="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2.5 text-white shadow hover:brightness-110"
                >
                  <Calendar className="h-4 w-4" /> Đặt lịch khám
                </Link>
                <Link
                  to="/chat"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50"
                >
                  <MessageSquare className="h-4 w-4" /> Nhắn tin tư vấn
                </Link>

                {doctor.workplace && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1 text-xs font-semibold text-slate-500">
                      Cơ sở khám
                    </div>
                    <div className="text-sm text-slate-800">
                      {doctor.workplace}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Related doctors */}
      {related.length > 0 && (
        <div className="container mx-auto px-4 py-10">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            Bác sĩ cùng chuyên khoa
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((d: Doctor) => (
              <Link
                key={d._id}
                to={`/doctors/${d._id}`}
                className="group rounded-2xl border border-blue-100 bg-white/80 p-4 shadow hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3">
                  {d.avatar ? (
                    <img
                      src={d.avatar}
                      className="h-14 w-14 rounded-xl object-cover border"
                      alt={d.name}
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                      <svg
                        className="h-7 w-7 text-blue-500"
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
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900">
                      BS. {d.name}
                    </div>
                    <div className="truncate text-sm text-slate-600">
                      {typeof d.specialty === "string"
                        ? d.specialty
                        : d.specialty?.name || ""}
                    </div>
                    {typeof d.experience !== "undefined" && (
                      <div className="text-xs text-slate-500">
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

/* ---------- Small UI atoms ---------- */
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-t-xl px-4 py-2 text-sm font-semibold transition
        ${active ? "text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
    >
      {children}
      {active && (
        <span className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded bg-gradient-to-r from-blue-500 to-teal-500" />
      )}
    </button>
  );
}

function CardBlock({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "purple";
  children: React.ReactNode;
}) {
  const ring =
    color === "blue"
      ? "ring-blue-200"
      : color === "emerald"
      ? "ring-emerald-200"
      : "ring-purple-200";
  const dot =
    color === "blue"
      ? "from-blue-500 to-teal-400"
      : color === "emerald"
      ? "from-emerald-500 to-green-400"
      : "from-purple-500 to-pink-400";
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow ring-1 ${ring}`}>
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`h-8 w-8 rounded-xl bg-gradient-to-br ${dot} text-white flex items-center justify-center`}
        >
          {icon}
        </div>
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
      {text}
    </div>
  );
}
