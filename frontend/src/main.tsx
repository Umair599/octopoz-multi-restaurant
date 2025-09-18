import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import MenuManager from "./pages/MenuManager";
import RestaurantList from "./pages/RestaurantList"; // new public listing page
import { setToken } from "./api";
import React from "react";
import "./index.css";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const token = localStorage.getItem("token");

if (token) setToken(token);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />}>
            {/* Public landing page: restaurant list */}
            <Route index element={<RestaurantList />} />

            {/* <Route index element={<Navigate to="/admin-login" />} /> */}

            <Route path="admin-login" element={<Login />} />

            {/* Super admin dashboard */}
            <Route
              path="admin"
              element={
                <ProtectedRoute>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Restaurant dashboard (for a specific restaurant’s staff, optional) */}
            <Route path="restaurant" element={<RestaurantDashboard />} />

            {/* Menu manager (per restaurant) */}
            <Route path="restaurant/:id/menu" element={<MenuManager />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
