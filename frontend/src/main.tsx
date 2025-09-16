import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import MenuManager from "./pages/MenuManager";
import { setToken } from "./api";

const token = localStorage.getItem("token");
if (token) setToken(token);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/login" />} />
          <Route path="login" element={<Login />} />
          <Route path="super" element={<SuperAdminDashboard />} />
          <Route path="restaurant" element={<RestaurantDashboard />} />
          <Route path="restaurant/:id/menu" element={<MenuManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
