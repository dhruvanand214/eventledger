import axios from "axios";
import { startLoading, stopLoading } from "../utils/networkLoader";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

let isHandlingSessionExpiry = false;

api.interceptors.request.use((config) => {
  startLoading();
  const token = localStorage.getItem("token");
  const isJwtLike = token && token.split(".").length === 3;

  if (isJwtLike && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    stopLoading();
    return response;
  },
  (error) => {
    stopLoading();
    const status = error?.response?.status;
    const message = error?.response?.data?.message;
    const url = error?.config?.url || "";

    const tokenErrors = [
      "Invalid token",
      "Session expired or invalid",
      "Not authorized"
    ];

    const isLoginCall = url.includes("/auth/login");

    if (status === 401 && tokenErrors.includes(message) && !isLoginCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("clubId");
      localStorage.removeItem("clubName");
      localStorage.removeItem("eventId");
      localStorage.removeItem("eventName");
      localStorage.removeItem("serviceType");
      localStorage.removeItem("isEventActive");

      if (!isHandlingSessionExpiry) {
        isHandlingSessionExpiry = true;
        alert("Session expired. Please login again.");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
