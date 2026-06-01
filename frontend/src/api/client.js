import axios from "axios";

import { useAuthStore } from "@/store/authStore";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const CSRF_COOKIE = "kessia_csrf";

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  // Send the httpOnly refresh cookie on auth calls (cross-origin in prod).
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Double-submit CSRF: echo the JS-readable cookie back as a header so the
  // cookie-authenticated auth endpoints (refresh, logout) accept the request.
  const csrf = getCookie(CSRF_COOKIE);
  if (csrf) {
    config.headers["X-CSRFToken"] = csrf;
  }
  return config;
});

let refreshPromise = null;

// Exchange the httpOnly refresh cookie for a fresh access token. No token is
// read from JS — the browser sends the cookie automatically.
export async function refreshAccessToken() {
  const csrf = getCookie(CSRF_COOKIE);
  const { data } = await axios.post(
    `${baseURL}/auth/refresh/`,
    {},
    {
      withCredentials: true,
      headers: csrf ? { "X-CSRFToken": csrf } : {},
    },
  );
  useAuthStore.getState().setAccessToken(data.access);
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        refreshPromise = null;
        useAuthStore.getState().clear();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  },
);
