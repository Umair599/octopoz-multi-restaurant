import React, { createContext, useState, useContext } from "react";
import { setToken, clearToken } from "../api";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuth] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();

  const login = (t: string) => {
    setToken(t);
    setAuth(true);
  };

  const logout = () => {
    clearToken();
    setAuth(false);
    
    // Check if we're on a subdomain
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const isSubdomain = hostname.includes('.localhost') ? parts[0] !== 'localhost' : parts.length > 2;
    
    if (isSubdomain) {
      // Redirect to subdomain login page
      navigate("/");
    } else {
      // Redirect to main admin login
      navigate("/admin-login");
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
};
