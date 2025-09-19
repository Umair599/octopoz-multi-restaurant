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
import SubdomainLogin from "./pages/SubdomainLogin";
import PublicMenu from "./pages/PublicMenu";
import { setToken } from "./api";
import React from "react";
import "./index.css";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const token = localStorage.getItem("token");

if (token) setToken(token);

// Function to get subdomain from hostname
function getSubdomain() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For localhost development, subdomain comes before .localhost
  if (hostname.includes('.localhost')) {
    return parts[0] !== 'localhost' ? parts[0] : null;
  }
  
  // For production, subdomain comes before main domain
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
}

// Main App Router Component
function AppRouter() {
  const subdomain = getSubdomain();
  
  // If we have a subdomain, render subdomain-specific routes
  if (subdomain) {
    return (
      <Routes>
        <Route path="/" element={<SubdomainLogin />} />
        <Route path="/menu" element={<PublicMenu />} />
        <Route path="/restaurant" element={
          <ProtectedRoute>
            <RestaurantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/menu" element={
          <ProtectedRoute>
            <MenuManager />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // Main domain routes (super admin, restaurant list, etc.)
  return (
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
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
