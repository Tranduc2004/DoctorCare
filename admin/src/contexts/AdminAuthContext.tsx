import React, { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Admin } from "../types/admin";

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
  isAuthenticated: boolean;
  initialized: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export { AdminAuthContext };

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({
  children,
}) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Check localStorage on mount
    const storedToken = localStorage.getItem("adminToken");
    const storedAdmin = localStorage.getItem("adminData");

    if (storedToken && storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        // Kiểm tra xem parsedAdmin có đúng format Admin không
        if (
          parsedAdmin &&
          typeof parsedAdmin === "object" &&
          parsedAdmin.username
        ) {
          setToken(storedToken);
          setAdmin(parsedAdmin);
        } else {
          // Nếu data không đúng format, xóa khỏi localStorage
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminData");
        }
      } catch (error) {
        console.error("Lỗi parse admin data từ localStorage:", error);
        // Nếu parse lỗi, xóa data không hợp lệ
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
      }
    }
    setInitialized(true);
  }, []);

  const login = (newToken: string, adminData: Admin) => {
    setToken(newToken);
    setAdmin(adminData);
    localStorage.setItem("adminToken", newToken);
    localStorage.setItem("adminData", JSON.stringify(adminData));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
  };

  const value: AdminAuthContextType = {
    admin,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!admin,
    initialized,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
