import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutGrid,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Search,
  Plus,
  Filter,
  Download,
  BadgeDollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  X,
  LogOut,
} from "lucide-react";

export default function PharmacyAdminDashboard() {
  return (
    <div className=" bg-gradient-to-br from-white via-[#EAF9F6] to-white text-slate-900">
      <div className=" grid grid-cols-1 md:grid-cols-[240px_1fr]">
        <Sidebar />
        <Main />
      </div>
    </div>
  );
}

/* ================= Sidebar ================= */
function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const items = [
    {
      icon: <LayoutGrid className="h-5 w-5" />,
      label: "Tổng quan",
      active: true,
    },
    { icon: <Package className="h-5 w-5" />, label: "Sản phẩm" },
    { icon: <ShoppingBag className="h-5 w-5" />, label: "Đơn hàng" },
    { icon: <Users className="h-5 w-5" />, label: "Khách hàng" },
    { icon: <BarChart3 className="h-5 w-5" />, label: "Báo cáo" },
    { icon: <Settings className="h-5 w-5" />, label: "Cài đặt" },
  ];
  return (
    <aside className="hidden md:block sticky top-0 h-screen border-r border-teal-100 bg-white/70 backdrop-blur">
      <div className="px-5 py-4 border-b border-teal-100">
        <div className="text-xl font-extrabold tracking-tight">
          Medi<span className="text-teal-600">Care</span>{" "}
          <span className="text-slate-700">Pharmacy</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Bảng điều khiển nhà thuốc
        </div>
      </div>
      <nav className="p-3 space-y-1">
        {items.map((it, i) => (
          <button
            key={i}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
              it.active
                ? "bg-teal-600 text-white"
                : "text-slate-700 hover:bg-teal-50"
            }`}
          >
            {it.icon}
            {it.label}
          </button>
        ))}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </nav>
      <div className="mt-4 px-3">
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
          💡 Mẹo: Cập nhật tồn kho mỗi ngày để tránh thiếu hàng.
        </div>
      </div>
    </aside>
  );
}

/* ================= Main ================= */
function Main() {
  return (
    <main className="min-h-screen">
      <Topbar />
      <div className="px-4 md:px-6 pb-10">
        <Kpis />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SalesPanel />
          <OrdersPanel />
          <LowStockPanel />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ProductsTable className="lg:col-span-2" />
          <AddProductCard />
        </div>
      </div>
    </main>
  );
}

/* ================= Topbar ================= */
function Topbar() {
  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-teal-100">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Tìm theo tên thuốc, mã SKU, hoạt chất…"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <button className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <Filter className="h-4 w-4" /> Bộ lọc
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:brightness-110">
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <Download className="h-4 w-4" /> Xuất CSV
        </button>
      </div>
    </div>
  );
}

/* ================= KPI Cards ================= */
function Kpis() {
  const cards = [
    {
      title: "Doanh thu hôm nay",
      value: "12.450.000₫",
      delta: "+12%",
      icon: <BadgeDollarSign className="h-5 w-5" />,
      tint: "from-teal-500 to-cyan-500",
    },
    {
      title: "Đơn hàng mới",
      value: "86",
      delta: "+8%",
      icon: <ShoppingBag className="h-5 w-5" />,
      tint: "from-emerald-500 to-teal-500",
    },
    {
      title: "Sản phẩm sắp hết",
      value: "7",
      delta: "-2",
      icon: <AlertTriangle className="h-5 w-5" />,
      tint: "from-amber-500 to-orange-500",
    },
    {
      title: "Khách hàng mới",
      value: "23",
      delta: "+5",
      icon: <Users className="h-5 w-5" />,
      tint: "from-violet-500 to-fuchsia-500",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {c.title}
              </div>
              <div className="mt-1 text-2xl font-extrabold">{c.value}</div>
              <div className="mt-1 text-xs text-teal-700">
                {c.delta} so với hôm qua
              </div>
            </div>
            <div
              className={`rounded-xl p-3 text-white bg-gradient-to-br ${c.tint}`}
            >
              {c.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= Sales Panel ================= */
function SalesPanel() {
  // fake data sparkline
  const points = [5, 8, 6, 9, 12, 10, 14, 13, 15, 18, 16, 20];
  const path = useMemo(() => {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const w = 280,
      h = 80;
    const step = w / (points.length - 1);
    const scaleY = (v: number) => h - ((v - min) / (max - min || 1)) * h;
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step},${scaleY(p)}`)
      .join(" ");
  }, [points]);

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
      <div className="mb-1 text-sm font-semibold">Doanh thu 14 ngày</div>
      <svg viewBox="0 0 280 80" className="mt-2 w-full">
        <path
          d={path}
          fill="none"
          stroke="#14B8A6"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-3 text-sm text-slate-600">
        Tổng: <span className="font-semibold text-slate-900">178.320.000₫</span>
      </div>
    </div>
  );
}

/* ================= Orders Panel ================= */
function OrdersPanel() {
  const items = [
    {
      id: "#A10234",
      customer: "Trần Minh",
      total: 325000,
      status: "completed",
    },
    {
      id: "#A10233",
      customer: "Nguyễn Lan",
      total: 189000,
      status: "processing",
    },
    { id: "#A10232", customer: "Phạm Hữu", total: 72000, status: "pending" },
  ];
  const badge = (s: string) =>
    s === "completed" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Hoàn tất
      </span>
    ) : s === "processing" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700 ring-1 ring-teal-200">
        <Clock3 className="h-3 w-3" /> Đang xử lý
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-200">
        <Clock3 className="h-3 w-3" /> Chờ
      </span>
    );
  const VND = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);
  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Đơn hàng gần đây</div>
        <button className="text-xs text-teal-700 hover:underline">
          Xem tất cả
        </button>
      </div>
      <div className="space-y-3">
        {items.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div className="text-sm font-medium">{o.id}</div>
            <div className="text-sm text-slate-600">{o.customer}</div>
            <div className="text-sm font-semibold text-slate-900">
              {VND(o.total)}
            </div>
            {badge(o.status)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= Low Stock Panel ================= */
function LowStockPanel() {
  const lows = [
    { name: "Paracetamol 500mg", sku: "PCM500", stock: 8 },
    { name: "Vitamin D3 1000IU", sku: "VD3-1K", stock: 12 },
    { name: "Gạc y tế 5x5", sku: "GAC55", stock: 4 },
  ];
  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Sắp hết hàng</div>
        <button className="text-xs text-teal-700 hover:underline">
          Quản lý tồn kho
        </button>
      </div>
      <div className="space-y-3">
        {lows.map((i) => (
          <div
            key={i.sku}
            className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800"
          >
            <div>
              <div className="text-sm font-semibold">{i.name}</div>
              <div className="text-xs">SKU: {i.sku}</div>
            </div>
            <div className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              {i.stock} sp
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= Products Table ================= */
function ProductsTable({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const data = [
    {
      name: "Paracetamol 500mg",
      sku: "PCM500",
      price: 18000,
      stock: 120,
      status: "active",
    },
    {
      name: "Vitamin C 1000mg",
      sku: "VITC1K",
      price: 69000,
      stock: 42,
      status: "active",
    },
    {
      name: "Nhiệt kế hồng ngoại",
      sku: "NKI-IR",
      price: 289000,
      stock: 9,
      status: "active",
    },
    {
      name: "Khẩu trang 4 lớp (50c)",
      sku: "MASK50",
      price: 35000,
      stock: 0,
      status: "inactive",
    },
    {
      name: "Gạc y tế 5x5 (100 miếng)",
      sku: "GAC55",
      price: 55000,
      stock: 4,
      status: "active",
    },
  ];
  const list = useMemo(
    () =>
      data.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.sku.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  const VND = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);

  return (
    <div
      className={`rounded-2xl border border-teal-100 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold">Danh sách sản phẩm</div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc SKU"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Sản phẩm</th>
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-right">Giá</th>
              <th className="px-3 py-2 text-center">Tồn</th>
              <th className="px-3 py-2 text-center">Trạng thái</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr
                key={r.sku}
                className="border-t border-slate-200 hover:bg-slate-50"
              >
                <td className="px-3 py-2 font-medium text-slate-900">
                  {r.name}
                </td>
                <td className="px-3 py-2 text-slate-600">{r.sku}</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {VND(r.price)}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ring-1 ${
                      r.stock === 0
                        ? "bg-rose-50 text-rose-700 ring-rose-200"
                        : r.stock < 10
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    }`}
                  >
                    {r.stock}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ring-1 ${
                      r.status === "active"
                        ? "bg-teal-50 text-teal-700 ring-teal-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    {r.status === "active" ? "Đang bán" : "Ẩn"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50">
                      Sửa
                    </button>
                    <button className="rounded-lg bg-teal-600 px-2 py-1 text-xs text-white hover:brightness-110">
                      Tồn kho
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-slate-600">
        Hiển thị {list.length} / {data.length} sản phẩm
      </div>
    </div>
  );
}

/* ================= Add Product Card / Modal (Mock) ================= */
function AddProductCard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="rounded-2xl border border-dashed border-teal-300 bg-white/60 p-4 text-center shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-600">
          <Plus className="h-6 w-6" />
        </div>
        <div className="mt-2 font-semibold">Thêm sản phẩm mới</div>
        <p className="mt-1 text-sm text-slate-600">
          Tạo SKU, giá bán, tồn kho ban đầu và trạng thái.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-3 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          Bắt đầu
        </button>
      </div>

      {open && <AddProductModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AddProductModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-white">
          <div className="text-base font-semibold">Thêm sản phẩm</div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Tên sản phẩm"
              placeholder="Ví dụ: Paracetamol 500mg"
            />
            <Field label="SKU" placeholder="Ví dụ: PCM500" />
            <Field label="Giá bán (VND)" type="number" placeholder="18000" />
            <Field label="Tồn kho" type="number" placeholder="100" />
            <SelectField label="Trạng thái" options={["Đang bán", "Ẩn"]} />
            <SelectField
              label="Danh mục"
              options={["Kê toa", "OTC", "Vitamin", "Thiết bị"]}
            />
          </div>
          <div className="text-right">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button className="ml-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
              Lưu sản phẩm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
