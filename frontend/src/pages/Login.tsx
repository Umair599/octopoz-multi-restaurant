import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login as loginApi } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = React.useState("super@octopoz.example");
  const [password, setPassword] = React.useState("password");
  const { login, isAuthenticated } = useAuth();
  const nav = useNavigate();

  if (isAuthenticated) return <Navigate to="/admin" />;
  async function doLogin(e: any) {
    e.preventDefault();
    try {
      const data = await loginApi(email, password);
      login(data.token);
      if (data.user.role === "super_admin") nav("/admin");
      else nav("/restaurant");
    } catch (e: any) {
      alert(e?.response?.data?.error || "login failed");
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={doLogin}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm"
      >
        <div>
          <label className="mb-2">Email</label>
          <input
            placeholder="Email"
            className="w-full mb-3 px-3 py-2 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            className="w-full mb-3 px-3 py-2 border rounded-lg"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
          type="submit"
        >
          Login
        </button>
      </form>
    </div>
  );
}
