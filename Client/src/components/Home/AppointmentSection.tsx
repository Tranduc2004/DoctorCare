// src/components/AppointmentSection.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "../../contexts/AuthContext";
import {
  createAppointment,
  getDoctorSchedules,
  getMyAppointments,
} from "../../api/appointmentApi";
import { toast } from "react-toastify";
import { getDoctors } from "../../api/doctorsApi";
import { specialtyApi } from "../../api/specialtyApi";

/* =================== Local Types =================== */
type Schedule = {
  _id: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status?: string;
  isBooked?: boolean;
};

type TimeSlot = {
  scheduleId: string;
  date: string;
  time: string;
  displayTime: string;
};

interface Specialty {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Doctor {
  _id: string;
  name: string;
  specialty?: string;
  workplace?: string;
  experience?: number;
  description?: string;
  consultationFee?: number;
}

/* =================== Driver Singleton =================== */
declare global {
  interface Window {
    __appointmentDriver?: Driver | null;
    __appointmentTourRunning?: boolean;
    gtag?: (...args: any[]) => void;
  }
}

const setDriverFlags = (running: boolean) => {
  window.__appointmentTourRunning = running;
};

const setDriverInstance = (inst: Driver | null) => {
  window.__appointmentDriver = inst;
};

/** Quét sạch mọi thứ còn sót của driver & khôi phục click */
const hardCleanupDriverDom = (): void => {
  try {
    // Hủy instance nếu còn
    window.__appointmentDriver?.destroy?.();
  } catch {}

  // Gỡ overlay, popover, stage, wrapper...
  const leftovers = document.querySelectorAll(
    [
      ".driver-overlay",
      ".driver-popover",
      ".driver-stage",
      ".driver-stage-wrapper",
      ".driver-backdrop",
      ".driver-active-element",
      ".driver-highlighted-element",
    ].join(",")
  );
  leftovers.forEach((el) => el.remove());

  // Gỡ class driver-active trên html/body
  document.documentElement.classList.remove("driver-active");
  document.body.classList.remove("driver-active");

  // Khôi phục trỏ chuột / click
  const els = [document.documentElement, document.body] as HTMLElement[];
  els.forEach((el) => {
    el.style.removeProperty("pointer-events");
    el.style.removeProperty("overflow");
    el.style.removeProperty("position");
  });

  // Hạ cờ
  setDriverFlags(false);
  setDriverInstance(null);
};

/* =================== Component =================== */
export default function AppointmentSection(): JSX.Element {
  const { user, isAuthenticated } = useAuth();

  // -------- States --------
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("");
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [symptoms, setSymptoms] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hasSeenAppointmentTour") === "true";
    } catch {
      return false;
    }
  });

  // -------- Driver refs --------
  const driverRef = useRef<Driver | null>(null);
  const isTourRunningRef = useRef<boolean>(false);

  /* ===== Helpers ===== */
  const ensureDriver = (): Driver => {
    if (window.__appointmentDriver) {
      driverRef.current = window.__appointmentDriver;
      return window.__appointmentDriver;
    }

    const inst = driver({
      showProgress: true,
      allowClose: true, // Cho phép đóng bằng nút X
      overlayClickNext: true, // Click overlay = NEXT (bước cuối = Done)
      animate: false,
      smoothScroll: false,
      stagePadding: 0,
      nextBtnText: "Tiếp tục",
      prevBtnText: "Quay lại",
      doneBtnText: "Hoàn tất",
      closeBtnText: "Bỏ qua",
      steps: [
        {
          element: "#specialty-select",
          popover: {
            title: "Chọn chuyên khoa",
            description: "Bước 1: Chọn chuyên khoa phù hợp với nhu cầu của bạn",
            side: "bottom",
            align: "start",
            className: "appointment-tour-popover",
          },
        },
        {
          element: "#doctor-select",
          popover: {
            title: "Chọn bác sĩ",
            description: "Bước 2: Chọn bác sĩ muốn khám",
            side: "bottom",
            align: "start",
            className: "appointment-tour-popover",
          },
        },
        {
          element: "#date-select",
          popover: {
            title: "Chọn ngày khám",
            description: "Bước 3: Chọn ngày bạn muốn đến khám",
            side: "bottom",
            className: "appointment-tour-popover",
          },
        },
        {
          element: ".time-slots-container",
          popover: {
            title: "Chọn giờ khám",
            description: "Bước 4: Chọn khung giờ 30 phút phù hợp",
            side: "top",
            className: "appointment-tour-popover",
          },
        },
        {
          element: "#symptoms",
          popover: {
            title: "Nhập triệu chứng",
            description: "Bước 5: Mô tả triệu chứng để bác sĩ nắm rõ",
            side: "top",
            className: "appointment-tour-popover",
          },
        },
        {
          element: "#submit-btn",
          popover: {
            title: "Hoàn tất",
            description: "Bước cuối: Xác nhận đặt lịch",
            side: "top",
            className: "appointment-tour-popover",
          },
        },
      ],
      onHighlightStarted: (element) => {
        const rect = (element as HTMLElement).getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + scrollTop - 100;
        window.scrollTo({ top: targetTop, left: 0 });
      },
      onDestroyStarted: () => {
        // Đóng/X — chỉ đóng tạm, KHÔNG set hasSeenTour
        isTourRunningRef.current = false;
        setDriverFlags(false);
        // Hủy hoàn toàn overlay, lớp và style còn sót
        setTimeout(hardCleanupDriverDom, 0);
      },
      onComplete: () => {
        // Hoàn tất — đánh dấu đã xem
        try {
          localStorage.setItem("hasSeenAppointmentTour", "true");
        } catch {}
        setHasSeenTour(true);
        isTourRunningRef.current = false;
        setDriverFlags(false);
        setTimeout(hardCleanupDriverDom, 0);
      },
    });

    driverRef.current = inst;
    setDriverInstance(inst);
    return inst;
  };

  const startTour = (): void => {
    const inst = ensureDriver();
    if (!isTourRunningRef.current && !window.__appointmentTourRunning) {
      isTourRunningRef.current = true;
      setDriverFlags(true);
      inst.drive();
    }
  };

  const forceCloseTour = (): void => {
    try {
      driverRef.current?.destroy?.();
    } catch {}
    hardCleanupDriverDom();
  };

  // ESC = đóng khẩn cấp
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") forceCloseTour();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Tạo slot 30 phút
  const generateTimeSlots = (schedule: Schedule): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const [sh, sm] = schedule.startTime.split(":").map((n) => parseInt(n, 10));
    const [eh, em] = schedule.endTime.split(":").map((n) => parseInt(n, 10));
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    for (let m = start; m < end; m += 30) {
      const h1 = Math.floor(m / 60),
        m1 = m % 60;
      const h2 = Math.floor((m + 30) / 60),
        m2 = (m + 30) % 60;
      const t1 = `${h1.toString().padStart(2, "0")}:${m1
        .toString()
        .padStart(2, "0")}`;
      const t2 = `${h2.toString().padStart(2, "0")}:${m2
        .toString()
        .padStart(2, "0")}`;
      slots.push({
        scheduleId: schedule._id,
        date: schedule.date,
        time: t1,
        displayTime: `${t1} - ${t2}`,
      });
    }
    return slots;
  };

  const getSpecialtyName = (specialtyId: string): string => {
    if (!specialtyId) return "";
    const sp = specialties.find((s) => s._id === specialtyId);
    return sp ? sp.name : "Không xác định";
  };

  /* ===== Effects ===== */
  // Load specialties
  useEffect(() => {
    (async () => {
      try {
        const data = await specialtyApi.getActiveSpecialties();
        setSpecialties(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading specialties:", e);
        toast.error("Không thể tải danh sách chuyên khoa");
      }
    })();
  }, []);

  // Load doctors theo chuyên khoa
  useEffect(() => {
    (async () => {
      try {
        if (!selectedSpecialtyId) {
          setDoctors([]);
          return;
        }
        const data = await getDoctors(selectedSpecialtyId);
        setDoctors(Array.isArray(data) ? data : []);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Không tải được bác sĩ");
      }
    })();
  }, [selectedSpecialtyId]);

  // Load schedules theo bác sĩ
  useEffect(() => {
    (async () => {
      if (!doctorId) {
        setSchedules([]);
        return;
      }
      try {
        setLoading(true);
        const data = await getDoctorSchedules(doctorId);
        const available = (data || []).filter(
          (s: Schedule) => s.status === "accepted" && !s.isBooked
        );
        setSchedules(available);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Không tải được lịch bác sĩ");
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId]);

  // Tạo nút "Xem hướng dẫn" & auto-start lần đầu
  useEffect(() => {
    // Auto-start một lần nếu chưa xem
    if (!hasSeenTour && !isTourRunningRef.current) {
      startTour();
    }

    // Nút trợ giúp
    const HELP_ID = "appointment-help-btn";
    if (!document.getElementById(HELP_ID)) {
      const helpBtn = document.createElement("button");
      helpBtn.id = HELP_ID;
      helpBtn.type = "button";
      helpBtn.setAttribute("aria-label", "Xem hướng dẫn đặt lịch");
      helpBtn.innerHTML = `<span class="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Xem hướng dẫn
      </span>`;
      helpBtn.className =
        "fixed left-4 bottom-4 z-50 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 flex items-center gap-2 border border-gray-200";
      helpBtn.onclick = () => {
        if (!isTourRunningRef.current) startTour();
        if (typeof window.gtag === "function") {
          window.gtag("event", "view_tutorial", {
            event_category: "Appointment",
            event_label: "Manual View",
          });
        }
      };
      document.body.appendChild(helpBtn);
    }

    return () => {
      // Cleanup tuyệt đối
      const btn = document.getElementById(HELP_ID);
      if (btn) btn.remove();
      forceCloseTour();
      hardCleanupDriverDom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSeenTour]);

  // ===== Derived slots =====
  const availableTimeSlots = useMemo<TimeSlot[]>(() => {
    let all: TimeSlot[] = [];
    for (const s of schedules) all = all.concat(generateTimeSlots(s));
    if (date) all = all.filter((slot) => slot.date === date);
    all.sort((a, b) =>
      a.date !== b.date
        ? a.date.localeCompare(b.date)
        : a.time.localeCompare(b.time)
    );
    return all;
  }, [date, schedules]);

  // ===== Submit =====
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.info("Vui lòng đăng nhập để đặt lịch");
      return;
    }
    if (!doctorId || !selectedTimeSlot) {
      toast.warning("Hãy chọn bác sĩ và khung giờ");
      return;
    }
    try {
      setLoading(true);
      await createAppointment({
        patientId: user._id,
        doctorId,
        scheduleId: selectedTimeSlot.scheduleId,
        symptoms,
        note,
        appointmentTime: selectedTimeSlot.time,
      });
      toast.success("Đặt lịch thành công! Đang chờ xác nhận");
      setSelectedTimeSlot(null);
      setSymptoms("");
      setNote("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Đặt lịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  /* =================== UI =================== */
  return (
    <section
      className="py-16 bg-gradient-to-r from-blue-500 to-teal-400 text-white"
      id="appointment"
      aria-label="Khu vực đặt lịch khám"
    >
      {/* Popover theme (inline, không cần file CSS) */}
      <style>{`
        .appointment-tour-popover {
          background: linear-gradient(to right, #3b82f6, #14b8a6);
          color: #fff;
          border-radius: 0.75rem;
          padding: 1rem;
          box-shadow: 0 10px 25px rgba(0,0,0,.15);
        }
        .appointment-tour-popover .driver-popover-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: .25rem;
        }
        .appointment-tour-popover .driver-popover-description { opacity: .95; }
        .appointment-tour-popover .driver-popover-footer { margin-top: .75rem; display: flex; gap: .5rem; }
        .appointment-tour-popover .driver-popover-close-btn,
        .appointment-tour-popover .driver-popover-btn { border-radius: .5rem; padding: .5rem .875rem; border: none; cursor: pointer; }
        .appointment-tour-popover .driver-popover-close-btn { background: rgba(255,255,255,.25); color: #fff; }
        .appointment-tour-popover .driver-popover-btn-next,
        .appointment-tour-popover .driver-popover-btn-done { background: linear-gradient(to right, #3b82f6, #14b8a6); color: #fff; }
        .appointment-tour-popover .driver-popover-btn-prev { background: rgba(255,255,255,.25); color: #fff; }

        /* Bảo đảm sau khi đóng vẫn click được: nếu vì lý do nào đó class còn lại */
        html.driver-active, body.driver-active { pointer-events: auto !important; overflow: auto !important; }
      `}</style>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Intro */}
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Đặt lịch khám ngay hôm nay
            </h2>
            <p className="mb-6">
              Đặt lịch khám trực tuyến nhanh chóng và tiện lợi. Chỉ cần vài bước
              đơn giản, bạn có thể lựa chọn bác sĩ và thời gian phù hợp nhất.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <CheckCircle size={20} className="mr-2" aria-hidden />{" "}
                <span>Chọn chuyên khoa và bác sĩ phù hợp</span>
              </li>
              <li className="flex items-center">
                <CheckCircle size={20} className="mr-2" aria-hidden />{" "}
                <span>Lựa chọn ngày và giờ theo lịch trình của bạn</span>
              </li>
              <li className="flex items-center">
                <CheckCircle size={20} className="mr-2" aria-hidden />{" "}
                <span>Nhận xác nhận ngay lập tức qua email</span>
              </li>
              <li className="flex items-center">
                <CheckCircle size={20} className="mr-2" aria-hidden />{" "}
                <span>Thông báo nhắc lịch hẹn trước 24 giờ</span>
              </li>
            </ul>
          </div>

          {/* Form */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Đặt lịch khám
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chuyên khoa */}
                <div>
                  <label
                    htmlFor="specialty-select"
                    className="block text-gray-700 mb-1"
                  >
                    Chuyên khoa
                  </label>
                  <select
                    id="specialty-select"
                    value={selectedSpecialtyId}
                    onChange={(e) => {
                      const specialtyId = e.target.value;
                      setSelectedSpecialtyId(specialtyId);
                      setDoctorId("");
                      setSchedules([]);
                      setSelectedTimeSlot(null);
                    }}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-describedby="specialty-help"
                  >
                    <option value="">-- Chọn chuyên khoa --</option>
                    {specialties
                      .filter((sp) => sp.isActive)
                      .map((sp) => (
                        <option key={sp._id} value={sp._id}>
                          {sp.name}
                        </option>
                      ))}
                  </select>
                  <p id="specialty-help" className="sr-only">
                    Chọn chuyên khoa trước để hiện danh sách bác sĩ
                  </p>
                </div>

                {/* Bác sĩ */}
                <div>
                  <label
                    htmlFor="doctor-select"
                    className="block text-gray-700 mb-1"
                  >
                    Bác sĩ
                  </label>
                  <select
                    id="doctor-select"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={!selectedSpecialtyId}
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map((d) => {
                      const specialtyName = getSpecialtyName(d.specialty || "");
                      const doctorInfo = [
                        d.name,
                        specialtyName,
                        d.workplace,
                        d.experience ? `${d.experience} năm kinh nghiệm` : "",
                      ]
                        .filter(Boolean)
                        .join(" - ");
                      return (
                        <option key={d._id} value={d._id}>
                          {doctorInfo}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Ngày khám */}
                <div>
                  <label
                    htmlFor="date-select"
                    className="block text-gray-700 mb-1"
                  >
                    Ngày khám
                  </label>
                  <input
                    id="date-select"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 text-black py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Triệu chứng */}
                <div>
                  <label
                    htmlFor="symptoms"
                    className="block text-gray-700 mb-1"
                  >
                    Triệu chứng
                  </label>
                  <input
                    id="symptoms"
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ví dụ: sốt, ho, đau đầu..."
                  />
                </div>
              </div>

              {/* Khung giờ */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Chọn khung giờ trống (mỗi slot 30 phút)
                </label>
                <div className="time-slots-container min-h-[100px] max-h-[200px] overflow-y-auto border border-gray-200 rounded-md p-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-600">
                      <Loader2
                        size={18}
                        className="mr-2 animate-spin"
                        aria-hidden
                      />
                      Đang tải lịch...
                    </div>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-8">
                      {!doctorId
                        ? "Vui lòng chọn bác sĩ để xem lịch trống"
                        : "Không có khung giờ phù hợp."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableTimeSlots.map((slot, index) => {
                        const isSelected =
                          selectedTimeSlot?.scheduleId === slot.scheduleId &&
                          selectedTimeSlot?.time === slot.time;
                        const displayLabel = date
                          ? slot.displayTime
                          : `${slot.date} - ${slot.displayTime}`;

                        return (
                          <button
                            type="button"
                            key={`${slot.scheduleId}-${slot.time}-${index}`}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`px-3 py-2 rounded-md border text-sm transition text-left ${
                              isSelected
                                ? "bg-teal-500 text-white border-teal-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                            aria-pressed={isSelected}
                          >
                            {displayLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedTimeSlot && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Đã chọn:</strong> {selectedTimeSlot.date} -{" "}
                    {selectedTimeSlot.displayTime}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div>
                <label htmlFor="note" className="block text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  placeholder="Ghi chú thêm (nếu có)"
                />
              </div>

              {/* Submit & Hidden Debug Button */}
              <button
                id="submit-btn"
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-medium rounded-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Xác nhận đặt lịch"}
              </button>
              <button
                id="force-close-tour"
                type="button"
                onClick={forceCloseTour}
                className="hidden"
                aria-hidden
              />
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
