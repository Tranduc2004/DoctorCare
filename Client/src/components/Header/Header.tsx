import { useState, useEffect, useRef, useLayoutEffect } from "react";
import type { ReactNode, CSSProperties } from "react";
import {
  Search,
  Menu,
  X,
  Home,
  User,
  Stethoscope,
  Newspaper,
  Phone,
  Layers,
  Calendar,
  FileText,
  ClipboardList,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  Mail,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect as reactUseEffect } from "react";
import { getUnreadCount } from "../../api/chatApi";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import { FaChevronDown } from "react-icons/fa";
import { chatBadge } from "../../store/chatBadge";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnimation, setMenuAnimation] = useState("hidden");
  const { user, isAuthenticated, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Xử lý hiệu ứng khi đóng/mở menu
  useLayoutEffect(() => {
    const getScrollbarWidth = () => {
      return window.innerWidth - document.documentElement.clientWidth;
    };

    if (isMenuOpen) {
      setMenuAnimation("visible");
      const scrollbarWidth = getScrollbarWidth();

      // Khóa cuộn bằng overflow thay vì position: fixed để tránh nhảy lên đầu trang
      document.documentElement.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      if (menuAnimation !== "hidden") {
        setMenuAnimation("closing");

        const timer = setTimeout(() => {
          setMenuAnimation("hidden");
          document.documentElement.style.overflow = "";
          document.body.style.paddingRight = "";
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isMenuOpen, menuAnimation]);

  // Đảm bảo khôi phục trạng thái khi component unmount
  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  // Sync unread badge from global store (keeps Header in sync with others)
  useEffect(() => {
    // ensure store knows current user and load persisted value
    chatBadge.setUser(isAuthenticated && user?._id ? user._id : null);
    // initialize local state from store
    setUnread(chatBadge.get());
    const unsub = chatBadge.subscribe((n) => setUnread(n));
    return () => unsub();
  }, [isAuthenticated, user?._id]);

  // Polling số tin chưa đọc cho bệnh nhân (also updates global store)
  reactUseEffect(() => {
    let timer: number | null = null;
    const loadUnread = async () => {
      if (isAuthenticated && user?.role === "patient") {
        try {
          const { count } = await getUnreadCount({
            role: "patient",
            patientId: user._id,
          });
          chatBadge.set(count);
        } catch {
          // ignore
        }
      } else {
        chatBadge.set(0);
      }
    };
    loadUnread();
    timer = window.setInterval(loadUnread, 7000) as unknown as number;
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isAuthenticated, user?._id, user?.role]);

  const handleLogout = () => {
    logout();
    closeMenu();
    toast.success("Đăng xuất thành công!");
    navigate("/");
  };

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Logo />
            <nav className="hidden md:flex ml-10 gap-2">
              <NavLinks horizontal isVisible />
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center text-gray-600 hover:text-teal-500 transition duration-200">
              <Search size={20} className="mr-1" />
              <span>Tìm kiếm</span>
            </button>
            <Link
              to="/appointment"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-md hover:opacity-90 transition duration-200"
            >
              Đặt lịch khám
            </Link>
            <button
              className="ml-2 hover:text-teal-500 transition duration-200 relative"
              onClick={openMenu}
            >
              <Menu size={28} />
              {isAuthenticated && user?.role === "patient" && unread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 min-w-[18px] h-[18px]">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu panel */}
      {menuAnimation !== "hidden" && (
        <div
          className={`fixed inset-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuAnimation === "closing"
              ? "opacity-0 pointer-events-none"
              : menuAnimation === "visible"
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-black/10 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              menuAnimation === "visible"
                ? "opacity-100"
                : menuAnimation === "closing"
                ? "opacity-0"
                : "opacity-0"
            }`}
            onClick={closeMenu}
          />

          <div
            ref={menuRef}
            className={`absolute right-0 top-0 h-full w-full max-w-xs bg-white shadow-2xl rounded-l-2xl flex flex-col z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu will-change-transform ${
              menuAnimation === "visible"
                ? "translate-x-0"
                : menuAnimation === "closing"
                ? "translate-x-full"
                : "translate-x-full"
            }`}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition duration-200"
              onClick={closeMenu}
            >
              <X size={28} />
            </button>

            <div
              className={`flex flex-col items-center mt-8 mb-6 transition-all duration-300 ${
                menuAnimation === "visible"
                  ? "opacity-100 translate-y-0 delay-100"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <Logo />
              {isAuthenticated && user && (
                <div className="mt-2 text-gray-700 font-semibold text-center">
                  Xin chào, {user.name}
                </div>
              )}
            </div>

            <nav
              className={`flex-1 flex flex-col gap-1 px-4 overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuAnimation === "visible"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <NavLinks
                onClick={closeMenu}
                isVisible={menuAnimation === "visible"}
              />

              <div className="border-t my-3" />

              <MenuLink
                icon={<Stethoscope size={20} />}
                to="/appointment"
                onClick={closeMenu}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-md hover:opacity-90 transition duration-200"
              >
                Đặt lịch khám
              </MenuLink>

              {isAuthenticated && (
                <>
                  <div className="mt-4 p-4 pl-2">
                    <h1 className="text-teal-500 text-lg font-semibold mb-3">
                      Tài khoản của tôi
                    </h1>
                    <ul className="space-y-2">
                      <li>
                        <MenuLink
                          icon={<User size={18} />}
                          to="/profile"
                          onClick={closeMenu}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Hồ sơ cá nhân
                        </MenuLink>
                      </li>
                      <li>
                        <MenuLink
                          icon={<Calendar size={18} />}
                          to="/appointments/my"
                          onClick={closeMenu}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Lịch hẹn khám
                        </MenuLink>
                      </li>
                      <li>
                        <MenuLink
                          icon={<FileText size={18} />}
                          to="/prescriptions/my"
                          onClick={closeMenu}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Đơn thuốc
                        </MenuLink>
                      </li>
                      <li>
                        <MenuLink
                          icon={<ClipboardList size={18} />}
                          to="/diagnosis/my"
                          onClick={closeMenu}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Bệnh án
                        </MenuLink>
                      </li>
                      <li>
                        <div className="relative">
                          <MenuLink
                            icon={<Mail size={18} />}
                            to="/chat"
                            onClick={closeMenu}
                            className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg pr-8"
                          >
                            Tin nhắn
                          </MenuLink>
                          {unread > 0 && (
                            <span className="absolute top-1 right-2 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
                              {unread}
                            </span>
                          )}
                        </div>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </nav>

            {/* Phần footer menu */}
            <div
              className={`mt-auto border-t transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuAnimation === "visible"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              {isAuthenticated ? (
                <div className="p-4 space-y-2">
                  <MenuLink
                    icon={<Settings size={18} />}
                    to="/settings"
                    onClick={closeMenu}
                    className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cài đặt
                  </MenuLink>
                  <MenuLink
                    icon={<Mail size={18} />}
                    to="/contact"
                    onClick={closeMenu}
                    className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Liên hệ hỗ trợ
                  </MenuLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition duration-200"
                  >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <MenuLink
                    icon={<LogIn size={18} />}
                    to="/login"
                    onClick={closeMenu}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-lg hover:opacity-90 transition duration-200 justify-center"
                  >
                    Đăng nhập
                  </MenuLink>
                  <MenuLink
                    icon={<UserPlus size={18} />}
                    to="/register"
                    onClick={closeMenu}
                    className="w-full px-4 py-2 bg-white border border-teal-400 text-teal-500 rounded-lg hover:bg-teal-50 transition duration-200 justify-center"
                  >
                    Đăng ký
                  </MenuLink>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Logo component
function Logo() {
  return (
    <div className="flex items-center">
      <h1 className="text-2xl font-bold">
        <span className="text-gray-800">Medi</span>
        <span className="text-teal-500">Care</span>
      </h1>
    </div>
  );
}

// Link có icon cho menu panel
type MenuLinkProps = {
  icon: ReactNode;
  to: string;
  children: ReactNode;
  horizontal?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
};

function MenuLink({
  icon,
  to,
  children,
  horizontal,
  onClick,
  className,
  style,
}: MenuLinkProps) {
  const baseClass = horizontal
    ? "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 text-base"
    : "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 text-base";

  return (
    <Link
      to={to}
      className={`${baseClass} ${className || ""}`}
      style={style}
      onClick={() => {
        window.scrollTo(0, 0);
        if (onClick) onClick();
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

// NavLinks
type NavLinksProps = {
  horizontal?: boolean;
  onClick?: () => void;
  isVisible?: boolean;
};

function NavLinks({ horizontal, onClick, isVisible }: NavLinksProps) {
  const links = [
    { text: "Trang chủ", path: "/", icon: <Home size={20} /> },
    { text: "Dịch vụ", path: "/services", icon: <Layers size={20} /> },
    // Dropdown cho Đội ngũ bác sĩ nằm riêng phía dưới
    { text: "Chuyên khoa", path: "/specialties", icon: <User size={20} /> },
    { text: "Tin tức", path: "/news", icon: <Newspaper size={20} /> },
    { text: "Liên hệ", path: "/contact", icon: <Phone size={20} /> },
  ];

  return (
    <>
      {links.map((link, index) => {
        const delayMs = isVisible ? 80 + index * 40 : 0;
        const transitionClasses =
          "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";
        const visibilityClasses = isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2";

        return (
          <MenuLink
            key={index}
            icon={link.icon}
            to={link.path}
            horizontal={horizontal}
            onClick={onClick}
            className={`${transitionClasses} ${visibilityClasses}`}
            style={{ transitionDelay: `${delayMs}ms` }}
          >
            {link.text}
          </MenuLink>
        );
      })}
      <div className="relative group">
        {/* Nút chính */}
        <SpecialtyDropdown horizontal={horizontal} onClick={onClick} />
        {/* Dropdown content */}
        <div className="absolute left-0 top-[calc(100%-6px)] hidden group-hover:block z-50">
          {/* Nội dung menu của SpecialtyDropdown sẽ render ở đây */}
        </div>

        {/* Vùng hover đệm để không bị mất khi rê chuột */}
        <div className="absolute left-0 top-full w-full h-4 -mt-1 bg-transparent"></div>
      </div>
    </>
  );
}

function SpecialtyDropdown({
  horizontal,
  onClick,
}: {
  horizontal?: boolean;
  onClick?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const [specialties, setSpecialties] = useState<
    { _id: string; name: string }[]
  >([]);
  useEffect(() => {
    import("../../api/specialtyApi").then(({ specialtyApi }) => {
      specialtyApi
        .getActiveSpecialties()
        .then((data) => setSpecialties(data || []))
        .catch(() => {});
    });
  }, []);
  return (
    <div
      className={`relative ${horizontal ? "" : ""}`}
      onMouseEnter={() => {
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        setOpen(true);
      }}
      onMouseLeave={() => {
        if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(
          () => setOpen(false),
          150
        ) as unknown as number;
      }}
    >
      <MenuLink
        icon={<Stethoscope size={20} />}
        to="/doctors"
        horizontal={horizontal}
        onClick={onClick}
      >
        Đội ngũ bác sĩ <FaChevronDown size={12} style={{ marginTop: 4 }} />
      </MenuLink>
      {open && specialties.length > 0 && (
        <div
          className="absolute left-0 top-full -mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          onMouseEnter={() => {
            if (closeTimerRef.current) {
              window.clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
            setOpen(true);
          }}
          onMouseLeave={() => {
            if (closeTimerRef.current)
              window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = window.setTimeout(
              () => setOpen(false),
              150
            ) as unknown as number;
          }}
        >
          <div className="py-2 max-h-72 overflow-auto">
            {specialties.map((s) => (
              <MenuLink
                key={s._id}
                icon={<Layers size={16} />}
                to={`/doctors?specialty=${s._id}`}
                onClick={onClick}
                className="w-full !px-4 !py-2 text-sm"
              >
                {s.name}
              </MenuLink>
            ))}
          </div>
        </div>
      )}
      {/* Vùng đệm hover để dễ di chuyển chuột từ nút xuống menu */}
      {open && <div className="absolute left-0 top-full w-full h-8 -mt-1" />}
    </div>
  );
}
