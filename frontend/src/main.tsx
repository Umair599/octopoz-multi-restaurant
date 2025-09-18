import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import MenuManager from "./pages/MenuManager";
import RestaurantList from "./pages/RestaurantList";
import CustomerMenu from "./pages/CustomerMenu";
import TableReservation from "./pages/TableReservation";
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

            {/* Admin login */}
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

            {/* Restaurant dashboard (for a specific restaurant's staff) */}
            <Route 
              path="restaurant-dashboard" 
              element={
                <ProtectedRoute>
                  <RestaurantDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Menu manager (per restaurant) - Protected route for restaurant staff */}
            <Route 
              path="restaurant/:id/admin/menu" 
              element={
                <ProtectedRoute>
                  <MenuManager />
                </ProtectedRoute>
              } 
            />

            {/* Public customer-facing pages */}
            <Route path="restaurant/:restaurantId/menu" element={<CustomerMenu />} />
            <Route path="restaurant/:restaurantId/reserve" element={<TableReservation />} />
            <Route path="restaurant/:restaurantId/table/:tableId/menu" element={<CustomerMenu />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
