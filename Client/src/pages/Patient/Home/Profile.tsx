import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getMyProfile,
  saveMyInsurance,
  saveMyProfile,
} from "../../../api/appointmentApi";
import { toast } from "react-toastify";
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  IdCard,
  HeartPulse,
  ShieldCheck,
  Languages,
  Bell,
  Save,
  Loader2,
  ShieldQuestion,
  Droplets,
  Scale,
  Ruler,
  Users,
} from "lucide-react";

// Types for stronger typing (optional based on your backend)
type Profile = {
  fullName?: string;
  dob?: string; // YYYY-MM-DD
  gender?: "male" | "female" | "other" | "";
  address?: string;
  phone?: string;
  email?: string;
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "";
  heightCm?: number | string; // keep as string for inputs
  weightKg?: number | string;
  allergies?: string; // comma separated for simplicity
  chronicConditions?: string; // comma separated
  medications?: string; // comma separated
  preferredLanguage?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  consentShareRecords?: boolean; // chia sẻ hồ sơ cho bác sĩ khám
  consentNotifications?: boolean; // nhận nhắc lịch, đơn thuốc
};

type Insurance = {
  provider?: string;
  policyNumber?: string;
  validFrom?: string; // YYYY-MM-DD
  validTo?: string; // YYYY-MM-DD
  regionCode?: string; // mã KCB ban đầu
};

export default function PatientProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({});
  const [insurance, setInsurance] = useState<Insurance>({});

  const canUse = isAuthenticated && user?.role === "patient";

  // Derived flags
  const isValidEmail = useMemo(() => {
    if (!profile.email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email);
  }, [profile.email]);

  const isValidPhone = useMemo(() => {
    if (!profile.phone) return true;
    return /^(\+?\d{7,15})$/.test(String(profile.phone).replace(/\s/g, ""));
  }, [profile.phone]);

  const isValidEmergency = useMemo(() => {
    if (!profile.emergencyContactPhone) return true;
    return /^(\+?\d{7,15})$/.test(
      String(profile.emergencyContactPhone).replace(/\s/g, "")
    );
  }, [profile.emergencyContactPhone]);

  const canSave = useMemo(() => {
    return (
      isValidEmail &&
      isValidPhone &&
      isValidEmergency &&
      (!!profile.fullName || !!profile.phone || !!profile.email) // at least some basics
    );
  }, [
    isValidEmail,
    isValidPhone,
    isValidEmergency,
    profile.fullName,
    profile.phone,
    profile.email,
  ]);

  useEffect(() => {
    (async () => {
      if (!canUse || !user?._id) return;
      try {
        setLoading(true);
        const data = await getMyProfile(user._id);
        setProfile({
          fullName: data?.profile?.fullName || user?.name || "",
          dob: data?.profile?.dob || "",
          gender: data?.profile?.gender || "",
          address: data?.profile?.address || "",
          phone: data?.profile?.phone || "",
          email: data?.profile?.email || user?.email || "",
          bloodType: data?.profile?.bloodType || "",
          heightCm: data?.profile?.heightCm ?? "",
          weightKg: data?.profile?.weightKg ?? "",
          allergies: data?.profile?.allergies || "",
          chronicConditions: data?.profile?.chronicConditions || "",
          medications: data?.profile?.medications || "",
          preferredLanguage: data?.profile?.preferredLanguage || "vi",
          emergencyContactName: data?.profile?.emergencyContactName || "",
          emergencyContactPhone: data?.profile?.emergencyContactPhone || "",
          consentShareRecords: Boolean(
            data?.profile?.consentShareRecords ?? true
          ),
          consentNotifications: Boolean(
            data?.profile?.consentNotifications ?? true
          ),
        });
        setInsurance({
          provider: data?.insurance?.provider || "",
          policyNumber: data?.insurance?.policyNumber || "",
          validFrom: data?.insurance?.validFrom || "",
          validTo: data?.insurance?.validTo || "",
          regionCode: data?.insurance?.regionCode || "",
        });
      } catch {
        toast.error("Không tải được hồ sơ");
      } finally {
        setLoading(false);
      }
    })();
  }, [canUse, user?._id]);

  const handleSave = async () => {
    if (!user?._id || !canSave) return;
    try {
      setSaving(true);
      await saveMyProfile(user._id, profile);
      await saveMyInsurance(user._id, insurance);
      toast.success("Đã lưu hồ sơ & BHYT");
    } catch (e) {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (!canUse)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-600">
        Cần đăng nhập bằng tài khoản <b className="mx-1">bệnh nhân</b>
      </div>
    );

  return (
    <div className="min-h-[70vh] bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-7">
          <h1 className="text-2xl sm:text-3xl font-bold">Hồ sơ bệnh nhân</h1>
          <p className="text-white/90">
            Cập nhật thông tin cá nhân, y khoa và bảo hiểm y tế.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-slate-600">
            <span className="text-sm">ID: </span>
            <span className="text-sm font-mono bg-white/80 px-2 py-0.5 rounded border">
              {user?._id}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white shadow-sm ${
              !canSave || saving
                ? "bg-slate-400"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-slate-200/60 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500 text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Thông tin cá nhân
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="Họ tên"
                      value={profile.fullName || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2"
                        value={profile.dob || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, dob: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    value={profile.gender || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        gender: e.target.value as Profile["gender"],
                      })
                    }
                  >
                    <option value="">-- Giới tính --</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2"
                      placeholder="Địa chỉ"
                      value={profile.address || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      className={`w-full rounded-lg border pl-9 pr-3 py-2 ${
                        isValidPhone ? "border-slate-300" : "border-rose-400"
                      }`}
                      placeholder="Điện thoại (+84...)"
                      value={profile.phone || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      className={`w-full rounded-lg border pl-9 pr-3 py-2 ${
                        isValidEmail ? "border-slate-300" : "border-rose-400"
                      }`}
                      placeholder="Email"
                      value={profile.email || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Medical */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-rose-500 text-white">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Thông tin y khoa
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="relative">
                    <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2"
                      value={profile.bloodType || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          bloodType: e.target.value as Profile["bloodType"],
                        })
                      }
                    >
                      <option value="">Nhóm máu</option>
                      {(
                        [
                          "A+",
                          "A-",
                          "B+",
                          "B-",
                          "AB+",
                          "AB-",
                          "O+",
                          "O-",
                        ] as const
                      ).map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2"
                      placeholder="Chiều cao (cm)"
                      value={profile.heightCm ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, heightCm: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2"
                      placeholder="Cân nặng (kg)"
                      value={profile.weightKg ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, weightKg: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Dị ứng (ngăn cách bằng dấu phẩy)"
                    value={profile.allergies || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, allergies: e.target.value })
                    }
                  />
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Bệnh mạn tính (ngăn cách bằng dấu phẩy)"
                    value={profile.chronicConditions || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        chronicConditions: e.target.value,
                      })
                    }
                  />
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
                    placeholder="Thuốc đang sử dụng (ngăn cách bằng dấu phẩy)"
                    value={profile.medications || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, medications: e.target.value })
                    }
                  />
                </div>
              </section>

              {/* Insurance */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white">
                    <IdCard className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Bảo hiểm y tế
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Cơ quan BHYT"
                    value={insurance.provider || ""}
                    onChange={(e) =>
                      setInsurance({ ...insurance, provider: e.target.value })
                    }
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Số thẻ"
                    value={insurance.policyNumber || ""}
                    onChange={(e) =>
                      setInsurance({
                        ...insurance,
                        policyNumber: e.target.value,
                      })
                    }
                  />
                  <div>
                    <label className="text-xs text-slate-500">
                      Hiệu lực từ
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      value={insurance.validFrom || ""}
                      onChange={(e) =>
                        setInsurance({
                          ...insurance,
                          validFrom: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">
                      Hiệu lực đến
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      value={insurance.validTo || ""}
                      onChange={(e) =>
                        setInsurance({ ...insurance, validTo: e.target.value })
                      }
                    />
                  </div>
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
                    placeholder="Mã KCB ban đầu"
                    value={insurance.regionCode || ""}
                    onChange={(e) =>
                      setInsurance({ ...insurance, regionCode: e.target.value })
                    }
                  />
                </div>
                {/* Small helper */}
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                  <ShieldQuestion className="h-4 w-4" /> Điền chính xác để hưởng
                  quyền lợi BHYT khi khám.
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Preferences */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500 text-white">
                    <Bell className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Tùy chọn & Quyền riêng tư
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-slate-700">
                        Cho phép bác sĩ đang khám xem hồ sơ y khoa của tôi
                      </span>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={Boolean(profile.consentShareRecords)}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            consentShareRecords: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:h-5 after:w-5 after:bg-white after:rounded-full after:absolute after:top-0.5 after:left-0.5 relative transition-all" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-sky-600" />
                      <span className="text-sm text-slate-700">
                        Nhận thông báo nhắc lịch/đơn thuốc
                      </span>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={Boolean(profile.consentNotifications)}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            consentNotifications: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-sky-500 after:content-[''] after:h-5 after:w-5 after:bg-white after:rounded-full after:absolute after:top-0.5 after:left-0.5 relative transition-all" />
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs text-slate-500">
                    Ngôn ngữ ưu tiên
                  </label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2"
                      value={profile.preferredLanguage || "vi"}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          preferredLanguage: e.target.value,
                        })
                      }
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Emergency contact */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-fuchsia-600 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Liên hệ khẩn cấp
                  </h2>
                </div>
                <div className="space-y-3">
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Họ tên người liên hệ"
                    value={profile.emergencyContactName || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        emergencyContactName: e.target.value,
                      })
                    }
                  />
                  <input
                    className={`w-full rounded-lg border px-3 py-2 ${
                      isValidEmergency ? "border-slate-300" : "border-rose-400"
                    }`}
                    placeholder="Điện thoại (+84...)"
                    value={profile.emergencyContactPhone || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Thông tin này giúp liên lạc khi có tình huống khẩn cấp.
                  </p>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Footer action duplicated for convenience */}
        {!loading && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-white shadow-sm ${
                !canSave || saving
                  ? "bg-slate-400"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu thay đổi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
