import React from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const [email, setEmail] = React.useState("super@octopoz.example");
  const [password, setPassword] = React.useState("password");
  const nav = useNavigate();
  async function doLogin(e: any) {
    e.preventDefault();
    try {
      const data = await login(email, password);
      if (data.user.role === "super_admin") nav("/super");
      else nav("/restaurant");
    } catch (e: any) {
      alert(e?.response?.data?.error || "login failed");
    }
  }
  return (
    <form onSubmit={doLogin} style={{ maxWidth: 400 }}>
      <div>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit">Login</button>
    </form>
  );
}
