import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:4000/api" });

export async function login(email: string, password: string) {
  const res = await API.post("/auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
  API.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
  return res.data;
}

export function setToken(t: string | null) {
  if (t) {
    API.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    localStorage.setItem("token", t);
  } else delete API.defaults.headers.common["Authorization"];
}
export function clearToken() {
  localStorage.removeItem("token");
  delete API.defaults.headers.common["Authorization"];
}
export default API;
