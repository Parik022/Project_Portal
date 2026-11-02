import axios from "axios";
import { demoAdapter } from "@/demo/adapter";

export const IS_DEMO = import.meta.env.VITE_DEMO === "true";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  // Demo build: answer requests in the browser instead of calling a server.
  ...(IS_DEMO ? { adapter: demoAdapter } : {}),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => (res.config.responseType === "blob" ? res : res.data),
  (err) => {
    const status = err.response?.status;
    // Expired or invalid session: drop the token and send the user to login.
    if (!IS_DEMO && status === 401 && localStorage.getItem("token") && !err.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") window.location.assign("/login?expired=1");
    }
    const message = err.response?.data?.message || (err.request && !err.response ? "Cannot reach the server" : err.message) || "Something went wrong";
    return Promise.reject({ message, status, errors: err.response?.data?.errors });
  }
);

export default api;
