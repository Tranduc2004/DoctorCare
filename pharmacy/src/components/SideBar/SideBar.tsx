import {
  LayoutGrid,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  LogOut,
  FolderOpen,
  Pill,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const items = [
    {
      icon: <LayoutGrid className="h-5 w-5" />,
      label: "Tổng quan",
      path: "/",
      active: location.pathname === "/",
    },
    {
      icon: <Pill className="h-5 w-5" />,
      label: "Quản lý thuốc",
      path: "/medicines",
      active: location.pathname === "/medicines",
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: "Sản phẩm",
      path: "/products",
      active: location.pathname === "/products",
    },
    {
      icon: <FolderOpen className="h-5 w-5" />,
      label: "Danh mục",
      path: "/categories",
      active: location.pathname === "/categories",
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      label: "Đơn hàng",
      path: "/orders",
      active: location.pathname === "/orders",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Khách hàng",
      path: "/customers",
      active: location.pathname === "/customers",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Báo cáo",
      path: "/reports",
      active: location.pathname === "/reports",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Cài đặt",
      path: "/settings",
      active: location.pathname === "/settings",
    },
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
            onClick={() => navigate(it.path)}
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
};

export default SideBar;
