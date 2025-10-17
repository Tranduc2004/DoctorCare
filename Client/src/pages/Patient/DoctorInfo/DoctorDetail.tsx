import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import { getDoctorById, getDoctorSchedules } from "../../../api/doctorsApi";
import {
  createAppointment,
  getAvailableTimeSlots,
} from "../../../api/appointmentApi";
import { useAuth } from "../../../contexts/AuthContext";
import { FaStar } from "react-icons/fa";

/* ===== Types ===== */
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
  rating?: number;
  totalReviews?: number;
  patientsTreated?: number;
  phone?: string;
  email?: string;
  address?: string;
};

type Schedule = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "accepted";
  isBooked: boolean;
};

/* ===== Fallback static data ===== */
const FALLBACK = {
  phone: "(555) 123-4567",
  email: "amelia.chen@healthconnect.com",
  address: "123 Medical Center Drive, New York, NY 10001",
  rating: 4.8,
  reviewCount: 256,
  breakdownPct: { 5: 70, 4: 20, 3: 5, 2: 3, 1: 2 },
  reviews: [
    {
      name: "Sophia Lee",
      date: "June 15, 2024",
      rating: 5,
      text: "Dr. Chen is an excellent doctor. She is very thorough and takes the time to listen to my concerns. I highly recommend her.",
      likes: 12,
      replies: 2,
    },
    {
      name: "Ethan Clark",
      date: "May 22, 2024",
      rating: 4,
      text: "Dr. Chen is knowledgeable and professional. The appointment felt a bit rushed, but overall a good experience.",
      likes: 5,
      replies: 1,
    },
    {
      name: "Olivia Davis",
      date: "April 10, 2024",
      rating: 5,
      text: "Dr. Chen is amazing! She is caring, attentive, and made me feel comfortable. I'm so glad I found her.",
      likes: 8,
      replies: 0,
    },
  ],
};

/* ===== Helpers ===== */
function monthMatrix(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const startIdx = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(42).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells[startIdx + d - 1] = d;
  return cells;
}

function getAvailableDaysInMonth(
  schedules: Schedule[],
  year: number,
  month: number
): Set<number> {
  const availableDays = new Set<number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  schedules.forEach((schedule) => {
    const scheduleDate = new Date(schedule.date);
    if (
      scheduleDate.getFullYear() === year &&
      scheduleDate.getMonth() === month &&
      scheduleDate >= today // Only include dates from today onwards
    ) {
      availableDays.add(scheduleDate.getDate());
    }
  });

  return availableDays;
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"overview" | "reviews" | "schedule">(
    "overview"
  );
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [baseMonth, setBaseMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [doctorData, scheduleData] = await Promise.all([
          getDoctorById(id),
          getDoctorSchedules(id),
        ]);
        setDoctor(doctorData);
        setSchedules(scheduleData || []);
      } catch {
        // use fallback
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
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 h-40 animate-pulse rounded-3xl bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8F7F5]">
      <div className="mx-auto max-w-5xl py-8">
        {/* Profile Header */}
        <div className="mb-8 flex items-start justify-between rounded-3xl bg-white p-8">
          <div className="flex gap-6">
            {doctor?.avatar ? (
              <img
                src={doctor.avatar}
                className="h-24 w-24 rounded-full object-cover"
                alt={doctor.name}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600">
                <span className="text-2xl font-semibold text-white">
                  {doctor?.name?.charAt(0) || "D"}
                </span>
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {doctor ? `Dr. ${doctor.name}` : "Dr. —"}
              </h1>
              <p className="mt-1 text-gray-600">
                {specText || "Internal Medicine"}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {doctor?.workplace || "123 Medical Center, New York, NY"}
              </p>
            </div>
          </div>

          <button className="rounded-lg bg-teal-500 px-6 py-2.5 font-medium text-white hover:bg-teal-600">
            Đặt lịch hẹn ngay
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-teal-500">
          <div className="flex gap-8">
            {[
              { key: "overview", label: "Tổng quan" },
              { key: "reviews", label: "Đánh giá" },
              { key: "schedule", label: "Đặt lịch" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() =>
                  setTab(t.key as "overview" | "reviews" | "schedule")
                }
                className={`relative pb-4 font-medium ${
                  tab === t.key
                    ? "text-teal-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
                {tab === t.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {tab === "overview" && (
          <div className="space-y-8">
            {/* About */}
            <section className="rounded-2xl bg-white p-6 ">
              <h2 className="mb-3 text-lg font-bold text-teal-600">
                Giới Thiệu Dr. {doctor?.name?.split(" ").pop() || "Chen"}
              </h2>
              <p className="leading-7 text-gray-700">
                {doctor?.description ||
                  "Dr. Amelia Chen is a board-certified internist with over 15 years of experience. She specializes in preventive care, chronic disease management, and women's health. Dr. Chen is committed to providing personalized and compassionate care to her patients."}
              </p>
            </section>

            {/* Contact Information */}
            <section className="rounded-2xl bg-white p-6 ">
              <h3 className="mb-4 text-lg font-bold text-teal-600">
                Thông tin liên hệ
                <span className="block border-b-1 border-gray-200 w-full p-2"></span>
              </h3>
              <div className="space-y-4">
                <ContactRow
                  icon={<Phone className="h-5 w-5" />}
                  label="Phone"
                  value={doctor?.phone || FALLBACK.phone}
                />
                <span className="block border-b-1 border-gray-200 w-full p-2"></span>
                <ContactRow
                  icon={<Mail className="h-5 w-5" />}
                  label="Email"
                  value={doctor?.email || FALLBACK.email}
                />
                <span className="block border-b-1 border-gray-200 w-full p-2"></span>
                <ContactRow
                  icon={<MapPin className="h-5 w-5" />}
                  label="Address"
                  value={
                    doctor?.address || doctor?.workplace || FALLBACK.address
                  }
                />
                <span className="block border-b-1 border-gray-200 w-full p-2"></span>
              </div>
            </section>

            {/* Availability */}
            <section className="rounded-2xl bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-teal-600">
                Ngày làm việc
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <CalendarMonth
                  date={baseMonth}
                  schedules={schedules}
                  onPrev={() => {
                    const d = new Date(baseMonth);
                    d.setMonth(d.getMonth() - 1);
                    setBaseMonth(d);
                  }}
                  side="left"
                />
                <CalendarMonth
                  date={
                    new Date(
                      baseMonth.getFullYear(),
                      baseMonth.getMonth() + 1,
                      1
                    )
                  }
                  schedules={schedules}
                  onNext={() => {
                    const d = new Date(baseMonth);
                    d.setMonth(d.getMonth() + 1);
                    setBaseMonth(d);
                  }}
                  side="right"
                />
              </div>
            </section>

            {/* Patient Reviews */}
            <ReviewsBlock
              avg={doctor?.rating ?? FALLBACK.rating}
              count={doctor?.totalReviews ?? FALLBACK.reviewCount}
              breakdownPct={FALLBACK.breakdownPct}
              reviews={FALLBACK.reviews}
            />
          </div>
        )}

        {tab === "reviews" && (
          <div>
            <ReviewsBlock
              avg={doctor?.rating ?? FALLBACK.rating}
              count={doctor?.totalReviews ?? FALLBACK.reviewCount}
              breakdownPct={FALLBACK.breakdownPct}
              reviews={FALLBACK.reviews}
            />
          </div>
        )}

        {tab === "schedule" && (
          <div className="space-y-6">
            {/* Schedule Header */}
            <section className="rounded-2xl bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-teal-600">
                Chọn lịch khám
              </h3>

              {/* Calendar */}
              <div className="mb-6">
                <h4 className="mb-3 text-base font-medium text-gray-900">
                  Ngày làm việc
                </h4>
                <div className="grid gap-6 md:grid-cols-2">
                  <VietnameseCalendarMonth
                    date={baseMonth}
                    schedules={schedules}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onPrev={() => {
                      const d = new Date(baseMonth);
                      d.setMonth(d.getMonth() - 1);
                      setBaseMonth(d);
                    }}
                    side="left"
                  />
                  <VietnameseCalendarMonth
                    date={
                      new Date(
                        baseMonth.getFullYear(),
                        baseMonth.getMonth() + 1,
                        1
                      )
                    }
                    schedules={schedules}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onNext={() => {
                      const d = new Date(baseMonth);
                      d.setMonth(d.getMonth() + 1);
                      setBaseMonth(d);
                    }}
                    side="right"
                  />
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <TimeSlotSelector
                  selectedDate={selectedDate}
                  onSlotSelect={(slot) => {
                    console.log("Selected slot:", slot);
                  }}
                  doctorId={id || ""}
                  user={user}
                  isAuthenticated={isAuthenticated}
                  navigate={navigate}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */
function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex items-center gap-3 text-gray-600"
        style={{ minWidth: "100px" }}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex-1 text-gray-900">{value}</div>
    </div>
  );
}

function CalendarMonth({
  date,
  schedules,
  onPrev,
  onNext,
  side,
}: {
  date: Date;
  schedules: Schedule[];
  onPrev?: () => void;
  onNext?: () => void;
  side: "left" | "right";
}) {
  const title = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const cells = monthMatrix(date);

  // Get available days from actual schedules
  const availableDays = getAvailableDaysInMonth(
    schedules,
    date.getFullYear(),
    date.getMonth()
  );

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="mb-4 flex items-center justify-between">
        {side === "left" && onPrev ? (
          <button
            onClick={onPrev}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
        ) : (
          <div className="w-8" />
        )}

        <div className="text-base font-semibold text-gray-900">{title}</div>

        {side === "right" && onNext ? (
          <button
            onClick={onNext}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((d, index) => (
          <div key={index} className="py-2 text-sm font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {cells.map((n, i) => (
          <div
            key={i}
            className={`flex h-10 items-center justify-center rounded-lg text-sm ${
              n
                ? availableDays.has(n)
                  ? "bg-teal-500 font-medium text-white"
                  : "text-gray-700 hover:bg-gray-50"
                : "text-transparent"
            }`}
          >
            {n ?? "-"}
          </div>
        ))}
      </div>
    </div>
  );
}

function VietnameseCalendarMonth({
  date,
  schedules,
  selectedDate,
  onDateSelect,
  onPrev,
  onNext,
  side,
}: {
  date: Date;
  schedules: Schedule[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  side: "left" | "right";
}) {
  const vietnameseMonths = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const title = `${vietnameseMonths[date.getMonth()]} ${date.getFullYear()}`;
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const cells = monthMatrix(date);

  // Get available days from actual schedules
  const availableDays = getAvailableDaysInMonth(
    schedules,
    date.getFullYear(),
    date.getMonth()
  );

  const handleDateClick = (day: number) => {
    // Check if date is available and not in the past
    const clickedDate = new Date(date.getFullYear(), date.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    if (availableDays.has(day) && clickedDate >= today) {
      const selectedDateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      onDateSelect(selectedDateStr);
    }
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate || !day) return false;
    const dayStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dayStr === selectedDate;
  };

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="mb-4 flex items-center justify-between">
        {side === "left" && onPrev ? (
          <button
            onClick={onPrev}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
        ) : (
          <div className="w-8" />
        )}

        <div className="text-base font-semibold text-gray-900">{title}</div>

        {side === "right" && onNext ? (
          <button
            onClick={onNext}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((d, index) => (
          <div key={index} className="py-2 text-sm font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {cells.map((n, i) => {
          if (!n) {
            return (
              <div
                key={i}
                className="flex h-10 items-center justify-center text-transparent"
              >
                ""
              </div>
            );
          }

          const clickedDate = new Date(date.getFullYear(), date.getMonth(), n);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isPastDate = clickedDate < today;
          const isAvailable = availableDays.has(n) && !isPastDate;
          const isSelected = isSelectedDate(n);

          return (
            <button
              key={i}
              onClick={() => n && handleDateClick(n)}
              disabled={!n || !isAvailable}
              className={`flex h-10 items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-teal-600 font-medium text-white border-2 border-teal-700"
                  : isAvailable
                  ? "bg-teal-500 font-medium text-white hover:bg-teal-600 cursor-pointer"
                  : isPastDate
                  ? "text-gray-300 cursor-not-allowed bg-gray-50"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewsBlock({
  avg,
  count,
  breakdownPct,
  reviews,
}: {
  avg: number;
  count: number;
  breakdownPct: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: {
    name: string;
    date: string;
    rating: number;
    text: string;
    likes: number;
    replies: number;
  }[];
}) {
  return (
    <section className="rounded-2xl bg-white p-6">
      <h3 className="mb-6 text-lg font-bold text-teal-600">
        Đánh giá của bệnh nhân
      </h3>

      <div className="mb-8 flex gap-8">
        {/* Rating Summary */}
        <div className="flex flex-col items-center">
          <div className="text-5xl font-bold text-gray-900">
            {avg.toFixed(1)}
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(avg)
                    ? "fill-yellow-300 text-yellow-400"
                    : i < avg
                    ? "fill-gray-300 text-gray-300"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="mt-1 text-sm text-gray-600">{count} Đánh giá</div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-700 whitespace-nowrap">
                {s}
                <FaStar className="inline-block text-yellow-300!" size={14} />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-yellow-300 border border-yellow-400"
                  style={{ width: `${breakdownPct[s as 1 | 2 | 3 | 4 | 5]}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm text-gray-600">
                {breakdownPct[s as 1 | 2 | 3 | 4 | 5]}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((r, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400">
              <span className="font-semibold text-white">
                {r.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{r.name}</div>
                  <div className="text-sm text-gray-500">{r.date}</div>
                </div>
              </div>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < r.rating
                        ? "fill-yellow-300 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 leading-6 text-gray-700">{r.text}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <button className="flex items-center gap-1.5 hover:text-gray-700">
                  <ThumbsUp className="h-4 w-4" />
                  {r.likes}
                </button>
                <button className="flex items-center gap-1.5 hover:text-gray-700">
                  <MessageSquare className="h-4 w-4" />
                  {r.replies}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimeSlotSelector({
  selectedDate,
  onSlotSelect,
  doctorId,
  user,
  isAuthenticated,
  navigate,
}: {
  selectedDate: string;
  onSlotSelect: (slot: string) => void;
  doctorId: string;
  user: { _id: string; name?: string; phone?: string; email?: string } | null;
  isAuthenticated: boolean;
  navigate: (path: string) => void;
}) {
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [realTimeSlots, setRealTimeSlots] = useState<
    Array<{
      time: string;
      scheduleId: string;
      status: "available" | "booked";
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [patientName, setPatientName] = useState(user?.name || "");
  const [patientPhone, setPatientPhone] = useState(user?.phone || "");
  const [patientEmail, setPatientEmail] = useState(user?.email || "");

  // Load real time slots when date changes
  useEffect(() => {
    if (selectedDate && doctorId) {
      // Check if selected date is not in the past
      const selectedDateObj = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDateObj < today) {
        alert("Không thể đặt lịch cho ngày đã qua");
        setRealTimeSlots([]);
        return;
      }

      setLoading(true);
      getAvailableTimeSlots(doctorId, selectedDate)
        .then((slots) => {
          // Nếu có slots từ server thì dùng, nếu không thì dùng fallback
          if (slots && slots.length > 0) {
            setRealTimeSlots(slots);
          } else {
            // Fallback: Tạo lịch làm việc mẫu với ca 30 phút
            const generateFallbackSlots = () => {
              const fallbackSlots: Array<{
                time: string;
                scheduleId: string;
                status: "available" | "booked";
              }> = [];

              // Get current time for today's validation
              const now = new Date();
              const today = now.toISOString().split("T")[0];
              const currentTime = now.getHours() * 60 + now.getMinutes();

              const workingHours = [
                { start: 8, end: 12 }, // Buổi sáng: 8:00 - 12:00
                { start: 13, end: 17 }, // Buổi chiều: 13:00 - 17:00
              ];

              workingHours.forEach(({ start, end }) => {
                for (let hour = start; hour < end; hour++) {
                  // Tạo slot từ đầu giờ (:00) và giữa giờ (:30)
                  for (let minute = 0; minute < 60; minute += 30) {
                    const slotTimeInMinutes = hour * 60 + minute;

                    // Skip past time slots for today
                    if (
                      selectedDate === today &&
                      slotTimeInMinutes < currentTime
                    ) {
                      continue;
                    }

                    const timeSlot = `${hour
                      .toString()
                      .padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

                    fallbackSlots.push({
                      time: timeSlot,
                      scheduleId: `fallback-${selectedDate}-${hour}-${minute}`,
                      status: "available",
                    });
                  }
                }
              });

              return fallbackSlots;
            };

            setRealTimeSlots(generateFallbackSlots());
          }
        })
        .catch((error) => {
          console.error("Error loading time slots:", error);
          // Fallback: Tạo lịch làm việc mẫu với ca 30 phút
          const generateFallbackSlots = () => {
            const fallbackSlots: Array<{
              time: string;
              scheduleId: string;
              status: "available" | "booked";
            }> = [];

            // Get current time for today's validation
            const now = new Date();
            const today = now.toISOString().split("T")[0];
            const currentTime = now.getHours() * 60 + now.getMinutes();

            const workingHours = [
              { start: 8, end: 12 }, // Buổi sáng: 8:00 - 12:00
              { start: 13, end: 17 }, // Buổi chiều: 13:00 - 17:00
            ];

            workingHours.forEach(({ start, end }) => {
              for (let hour = start; hour < end; hour++) {
                // Tạo slot từ đầu giờ (:00) và giữa giờ (:30)
                for (let minute = 0; minute < 60; minute += 30) {
                  const slotTimeInMinutes = hour * 60 + minute;

                  // Skip past time slots for today
                  if (
                    selectedDate === today &&
                    slotTimeInMinutes < currentTime
                  ) {
                    continue;
                  }

                  const timeSlot = `${hour.toString().padStart(2, "0")}:${minute
                    .toString()
                    .padStart(2, "0")}`;

                  fallbackSlots.push({
                    time: timeSlot,
                    scheduleId: `fallback-${selectedDate}-${hour}-${minute}`,
                    status: "available",
                  });
                }
              }
            });

            return fallbackSlots;
          };

          setRealTimeSlots(generateFallbackSlots());
        })
        .finally(() => setLoading(false));
    }
  }, [selectedDate, doctorId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    return `${weekdays[date.getDay()]}, ${date.getDate()}/${
      date.getMonth() + 1
    }`;
  };

  const handleSlotClick = (time: string, status: string) => {
    // Chỉ cho phép chọn nếu slot có sẵn
    if (status === "available") {
      setSelectedSlot(time);
      onSlotSelect(time);
    }
  };

  const handleQuickBooking = async () => {
    console.log("Authentication check:");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("user:", user);
    console.log("patient_token:", localStorage.getItem("patient_token"));

    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để đặt lịch");
      navigate("/login");
      return;
    }

    if (!user?._id) {
      alert("Không thể xác định thông tin người dùng");
      return;
    }

    if (!selectedSlot) {
      alert("Vui lòng chọn khung giờ");
      return;
    }

    // Validate required patient information
    if (!patientName.trim()) {
      alert("Vui lòng nhập họ và tên");
      return;
    }

    if (!patientPhone.trim()) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }

    if (!patientEmail.trim()) {
      alert("Vui lòng nhập email");
      return;
    }

    // Tìm slot đã chọn để xác minh nó có khả dụng
    const selectedSlotData = realTimeSlots.find(
      (slot) => slot.time === selectedSlot
    );
    if (!selectedSlotData || selectedSlotData.status !== "available") {
      alert("Khung giờ này không khả dụng");
      return;
    }

    setBookingLoading(true);
    try {
      const appointmentData = {
        patientId: user._id,
        doctorId: doctorId,
        scheduleId: selectedSlotData.scheduleId,
        symptoms: symptoms,
        appointmentTime: selectedSlot,
        mode: "offline" as const,
        note: symptoms ? `Triệu chứng: ${symptoms}` : "",
      };

      // Add patientInfo like in AppointmentSection
      (appointmentData as unknown as Record<string, unknown>).patientInfo = {
        name: patientName,
        phone: patientPhone,
        email: patientEmail,
      };

      const response = await createAppointment(appointmentData);

      console.log("Create appointment response:", response);
      console.log("Appointment data sent:", appointmentData);

      if (response.success && response.data) {
        alert("Đặt lịch thành công! Chuyển đến trang thanh toán.");
        // Navigate to payment page with appointment ID
        navigate(`/payments/${response.data._id}`);
      } else {
        alert("Có lỗi xảy ra khi đặt lịch");
      }
    } catch (error: unknown) {
      console.error("Booking error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi đặt lịch";
      alert(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border-t border-gray-200 pt-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Đang tải khung giờ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="mb-4">
        <h4 className="text-base font-medium text-gray-900 mb-2">
          Chọn khung giờ khám
        </h4>
        <p className="text-sm text-gray-600">
          Ngày đã chọn: {formatDate(selectedDate)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          * Lịch hẹn có thể thay đổi. Vui lòng gọt điện thoại để được xác nhận.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {realTimeSlots.map((slot) => {
          // Kiểm tra xem slot có khả dụng không
          const isClickable = slot.status === "available";

          return (
            <button
              key={slot.time}
              onClick={() => handleSlotClick(slot.time, slot.status)}
              disabled={!isClickable}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                selectedSlot === slot.time
                  ? "bg-teal-600 text-white border-teal-600"
                  : isClickable
                  ? "bg-white text-teal-600 border-teal-200 hover:bg-teal-50"
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
            >
              {slot.time}
              {!isClickable && (
                <div className="text-xs mt-1 text-red-500">Đã đặt</div>
              )}
            </button>
          );
        })}
      </div>

      {selectedSlot && (
        <div className="mt-6 space-y-4">
          {/* Patient Information Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="Nhập địa chỉ email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          {/* Symptoms input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Triệu chứng hoặc lý do khám (tùy chọn)
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Mô tả ngắn gọn triệu chứng hoặc lý do bạn muốn khám..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Booking confirmation */}
          <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-teal-800">
                  Thông tin đặt lịch khám
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-medium text-teal-700">Khung giờ:</span>
                  <span className="text-teal-600 ml-1">
                    {selectedSlot} - {formatDate(selectedDate)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-teal-700">Bệnh nhân:</span>
                  <span className="text-teal-600 ml-1">{patientName}</span>
                </div>
                <div>
                  <span className="font-medium text-teal-700">Điện thoại:</span>
                  <span className="text-teal-600 ml-1">{patientPhone}</span>
                </div>
                <div>
                  <span className="font-medium text-teal-700">Email:</span>
                  <span className="text-teal-600 ml-1">{patientEmail}</span>
                </div>
              </div>

              {symptoms && (
                <div>
                  <span className="font-medium text-teal-700 text-xs">
                    Triệu chứng:
                  </span>
                  <p className="text-xs text-teal-600 mt-1">
                    {symptoms.substring(0, 100)}
                    {symptoms.length > 100 ? "..." : ""}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleQuickBooking}
                  disabled={
                    bookingLoading ||
                    !patientName.trim() ||
                    !patientPhone.trim() ||
                    !patientEmail.trim()
                  }
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? "Đang đặt..." : "Đặt lịch khám"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
