import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  Activity,
  Home,
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  CreditCard,
  Wallet,
  ChevronDown,
  ChevronRight,
  Building2,
  FileText,
  Shield,
} from "lucide-react";
import { FaUserMd } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { GiMedicines } from "react-icons/gi";
interface AdminLayoutProps {
  children: React.ReactNode;
}

interface DropdownState {
  [key: string]: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownState, setDropdownState] = useState<DropdownState>({});
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const toggleDropdown = (key: string) => {
    setDropdownState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const menuItems = [
    {
      icon: Home,
      label: "Trang chủ",
      path: "/dashboard",
      type: "single",
    },
    {
      icon: Users,
      label: "Quản lý người dùng",
      type: "dropdown",
      key: "users",
      children: [
        { icon: Users, label: "Bệnh nhân", path: "/patients" },
        { icon: FaUserMd, label: "Bác sĩ", path: "/doctors" },
        {
          icon: FaUserGroup,
          label: "Nhân viên Nhà thuốc",
          path: "/pharmacy-staff",
        },
      ],
    },
    {
      icon: Calendar,
      label: "Lịch & Lịch hẹn",
      type: "dropdown",
      key: "schedule",
      children: [
        { icon: Calendar, label: "Lịch làm việc", path: "/doctor-schedule" },
        { icon: Calendar, label: "Lịch hẹn", path: "/appointments" },
      ],
    },
    {
      icon: Building2,
      label: "Dịch vụ & Chuyên khoa",
      type: "dropdown",
      key: "services",
      children: [
        { icon: UserCheck, label: "Dịch vụ", path: "/services" },
        { icon: Calendar, label: "Chuyên khoa", path: "/specialties" },
      ],
    },
    {
      icon: Activity,
      label: "Thuốc & Bệnh án",
      type: "dropdown",
      key: "medical",
      children: [
        {
          icon: Activity,
          label: "Danh mục thuốc",
          path: "/pharmacy/categories",
        },
        {
          icon: GiMedicines,
          label: "Thuốc",
          path: "/pharmacy/medicines",
        },
        { icon: FileText, label: "Bệnh án", path: "/medical-records" },
      ],
    },
    {
      icon: CreditCard,
      label: "Thanh toán & Tài chính",
      type: "dropdown",
      key: "finance",
      children: [
        {
          icon: Wallet,
          label: "Tài khoản chuyển khoản",
          path: "/bank-accounts",
        },
        { icon: CreditCard, label: "Quản lý thanh toán", path: "/payments" },
        { icon: Shield, label: "BHYT", path: "/insurance" },
      ],
    },
    {
      icon: BarChart3,
      label: "Thống kê",
      path: "/statistics",
      type: "single",
    },
    {
      icon: Settings,
      label: "Cài đặt",
      path: "/settings",
      type: "single",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">MedAdmin</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md lg:hidden hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto max-h-[calc(100vh-160px)]">
          {menuItems.map((item, index) => {
            if (item.type === "single") {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => navigate(item.path!)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </div>
              );
            } else if (item.type === "dropdown") {
              const Icon = item.icon;
              const isOpen = dropdownState[item.key!];
              return (
                <div key={index} className="space-y-1">
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => toggleDropdown(item.key!)}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  {isOpen && (
                    <div className="ml-6 space-y-1">
                      {item.children?.map((child, childIndex) => {
                        const ChildIcon = child.icon;
                        return (
                          <div
                            key={childIndex}
                            className="flex items-center px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm"
                            onClick={() => navigate(child.path)}
                          >
                            <ChildIcon className="w-4 h-4 mr-3" />
                            <span className="font-medium">{child.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {admin?.username?.[0] || "A"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{admin?.username}</p>
              <p className="text-sm text-gray-600">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-md lg:hidden hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-900" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
