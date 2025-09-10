import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  specialty?: string;
  experience?: number;
  license?: string;
  workplace?: string;
  description?: string;
  avatar?: string;
  education?: string[];
  certifications?: string[];
  languages?: string[];
  consultationFee?: number;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: FormData | object) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Xác định portal hiện tại để tách phiên: /doctor dùng khóa riêng
  const getCurrentPortal = () => {
    if (typeof window === "undefined") return false;
    const pathname = window.location.pathname.toLowerCase();
    const isDoctor = pathname.startsWith("/doctor");
    return isDoctor;
  };

  const getStorageKey = () => {
    const key = getCurrentPortal() ? "user_doctor" : "user";
    return key;
  };

  // Production: luôn dùng localStorage; Dev: hỗ trợ ?tabSession=1 để dùng sessionStorage
  const getStorage = () => {
    if (typeof window === "undefined") return null;
    const isProd =
      typeof import.meta !== "undefined" ? import.meta.env.PROD : false;
    if (isProd) return window.localStorage;
    const params = new URLSearchParams(window.location.search);
    const useTab = params.get("tabSession") === "1";
    return useTab ? window.sessionStorage : window.localStorage;
  };

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storage = getStorage();
      const storageKey = getStorageKey();
      const raw = storage?.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      const storage = getStorage();
      const storageKey = getStorageKey();
      storage?.removeItem(storageKey);
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const storage = getStorage();
    const storageKey = getStorageKey();
    return !!storage?.getItem(storageKey);
  });

  // Theo dõi thay đổi của URL để cập nhật user state
  useEffect(() => {
    const handleStorageChange = () => {
      const storage = getStorage();
      const storageKey = getStorageKey();
      const raw = storage?.getItem(storageKey);

      if (raw) {
        try {
          const userData = JSON.parse(raw);
          setUser(userData);
          setIsAuthenticated(true);
        } catch {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    // Kiểm tra storage khi component mount
    handleStorageChange();

    // Lắng nghe sự kiện storage change (cho trường hợp multiple tabs)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Theo dõi thay đổi của URL để cập nhật user state khi navigate
  useEffect(() => {
    const checkAndUpdateUserState = () => {
      const storage = getStorage();
      const storageKey = getStorageKey();
      const raw = storage?.getItem(storageKey);

      if (raw) {
        try {
          const userData = JSON.parse(raw);
          if (JSON.stringify(userData) !== JSON.stringify(user)) {
            setUser(userData);
            setIsAuthenticated(true);
          }
        } catch {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        if (user) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    // Kiểm tra ngay khi component mount
    checkAndUpdateUserState();

    // Tạo một interval để kiểm tra định kỳ (fallback)
    const interval = setInterval(checkAndUpdateUserState, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      // Xác định API endpoint dựa trên portal hiện tại
      const isDoctorPortal = getCurrentPortal();
      const apiEndpoint = isDoctorPortal
        ? "http://localhost:5000/api/doctor/auth/login"
        : "http://localhost:5000/api/patient/auth/login";

      const response = await axios.post(apiEndpoint, {
        email,
        password,
      });

      const userData = response.data.user;

      setUser(userData);
      setIsAuthenticated(true);

      // Lưu vào storage với key phù hợp
      const storage = getStorage();
      const storageKey = getStorageKey();
      storage?.setItem(storageKey, JSON.stringify(userData));

      // Lưu token cho portal bác sĩ để gọi API bảo vệ
      if ((response.data as any)?.token) {
        window.localStorage.setItem("token", (response.data as any).token);
      }

      toast.success("Đăng nhập thành công!");
    } catch (error: unknown) {
      const errorData = error as { response?: { data?: { message?: string } } };
      toast.error(errorData.response?.data?.message || "Đăng nhập thất bại!");
      throw error;
    }
  };

  const register = async (userData: FormData | object) => {
    try {
      // Xác định API endpoint dựa trên portal hiện tại
      const isDoctorPortal = getCurrentPortal();
      const apiEndpoint = isDoctorPortal
        ? "http://localhost:5000/api/doctor/auth/register"
        : "http://localhost:5000/api/patient/auth/register";

      let response;

      if (isDoctorPortal) {
        // Doctor register - sử dụng FormData
        response = await axios.post(apiEndpoint, userData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Patient register - sử dụng JSON
        const jsonData =
          userData instanceof FormData
            ? Object.fromEntries(userData.entries())
            : userData;

        response = await axios.post(apiEndpoint, jsonData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      const newUser = response.data.user;

      setUser(newUser);
      setIsAuthenticated(true);

      // Lưu vào storage với key phù hợp
      const storage = getStorage();
      const storageKey = getStorageKey();
      storage?.setItem(storageKey, JSON.stringify(newUser));

      toast.success("Đăng ký thành công!");
    } catch (error: unknown) {
      const errorData = error as { response?: { data?: { message?: string } } };
      toast.error(errorData.response?.data?.message || "Đăng ký thất bại!");
      throw error;
    }
  };

  const logout = () => {
    const currentPortal = getCurrentPortal();
    const storage = getStorage();
    const storageKey = currentPortal ? "user_doctor" : "user";

    storage?.removeItem(storageKey);
    // Xóa token khi đăng xuất
    window.localStorage.removeItem("token");
    window.sessionStorage.setItem(
      "lastPortal",
      currentPortal ? "doctor" : "patient"
    );

    setUser(null);
    setIsAuthenticated(false);
  };
  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
