/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  pharmacyId?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  loading: boolean;
  // remember: if true store in localStorage, otherwise sessionStorage
  login: (token: string, user: User, remember?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken =
        localStorage.getItem("pharmacy_token") ||
        sessionStorage.getItem("pharmacy_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5001/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setToken(storedToken);
          setUser(userData.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("pharmacy_token");
          sessionStorage.removeItem("pharmacy_token");
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (tokenValue: string, userData: User, remember = true) => {
    try {
      if (remember) {
        localStorage.setItem("pharmacy_token", tokenValue);
        sessionStorage.removeItem("pharmacy_token");
      } else {
        sessionStorage.setItem("pharmacy_token", tokenValue);
        localStorage.removeItem("pharmacy_token");
      }
    } catch (e) {
      console.warn("Failed to persist token to storage", e);
    }

    setToken(tokenValue);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    try {
      localStorage.removeItem("pharmacy_token");
      sessionStorage.removeItem("pharmacy_token");
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="mt-4 text-slate-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
