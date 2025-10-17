import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

type Creds = { email: string; password: string; remember: boolean };

export default function PharmacyLogin() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [form, setForm] = useState<Creds>({
    email: "",
    password: "",
    remember: true,
  });

  const onChange = (k: keyof Creds, v: string | boolean) =>
    setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    if (!form.email.trim()) return "Vui lòng nhập email/username";
    if (!form.password.trim()) return "Vui lòng nhập mật khẩu";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setErr(msg);
    setErr("");
    setLoading(true);
    try {
      // TODO: gọi API login thật ở đây
      // const res = await fetch("/api/pharmacy/auth/login", { ... });
      // const data = await res.json(); localStorage.setItem("token", data.token);

      await new Promise((r) => setTimeout(r, 800)); // demo
      navigate("/pharmacy"); // điều hướng vào dashboard sau khi đăng nhập
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      } else {
        setErr("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex">
      {/* LEFT: brand / mô tả */}
      <div className="hidden lg:flex w-1/2 p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-teal-100/60" />
        <div className="absolute -left-28 -bottom-28 w-[420px] h-[420px] rounded-full bg-emerald-100/50" />
        <div className="z-10 mx-auto my-auto max-w-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-teal-500 text-white font-bold">
              Rx
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              MediCare Pharmacy
            </h1>
          </div>
          <p className="mt-6 text-slate-600 leading-relaxed">
            Quản trị nhà thuốc: đơn thuốc, tồn kho, đơn hàng & báo cáo doanh thu
            — tất cả trong một nơi.
          </p>

          <div className="mt-10 grid gap-4 text-teal-700">
            <div className="rounded-xl bg-white border border-teal-200 p-4">
              <div className="text-sm font-semibold">Bảo mật</div>
              <div className="text-sm text-slate-600">
                Mã hoá token & phân quyền vai trò.
              </div>
            </div>
            <div className="rounded-xl bg-white border border-teal-200 p-4">
              <div className="text-sm font-semibold">Tích hợp</div>
              <div className="text-sm text-slate-600">
                Kết nối EHR, đơn thuốc điện tử, thanh toán.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Đăng nhập nhà thuốc
            </h2>
            <p className="mt-2 text-slate-600">
              Truy cập Pharmacy Admin Dashboard.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm"
          >
            {/* Email */}
            <label className="block text-sm font-medium text-slate-700">
              Email / Username
            </label>
            <div className="mt-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={18} />
              </span>
              <input
                type="text"
                autoComplete="username"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="pharmacy.admin@domain.com"
                className="w-full h-11 rounded-xl border border-slate-300 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            {/* Password */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 rounded-xl border border-slate-300 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="mt-4 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => onChange("remember", e.target.checked)}
                  className="h-4 w-4 accent-teal-600"
                />
                Ghi nhớ đăng nhập
              </label>
              <Link
                to="/pharmacy/forgot-password"
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Error */}
            {err && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm">
                {err}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-white font-semibold hover:bg-teal-700 focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng nhập…
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-gray-500 text-sm">Hoặc</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            {/* Register */}
            <button
              className="px-2 d-flex items-center justify-center w-full text-sm text-teal-600 hover:text-teal-900 hover:border-teal-400 border border-slate-300 rounded-xl py-3 font-medium"
              onClick={() => navigate("/register")}
            >
              Tạo tài khoản
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
