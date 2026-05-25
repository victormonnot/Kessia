import axios from "axios";

import { useAuthStore } from "@/store/authStore";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }
  const { data } = await axios.post(`${baseURL}/auth/refresh/`, {
    refresh: refreshToken,
  });
  useAuthStore.getState().setAccessToken(data.access);
  // simplejwt with ROTATE_REFRESH_TOKENS returns a new refresh too
  if (data.refresh) {
    useAuthStore.setState({ refreshToken: data.refresh });
  }
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
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
