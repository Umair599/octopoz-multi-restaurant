import React from "react";
import { Outlet } from "react-router-dom";
export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Multi-Restaurant Starter</h1>
      <Outlet />
    </div>
  );
}
