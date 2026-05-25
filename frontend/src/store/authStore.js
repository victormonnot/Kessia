import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setAuth: ({ access, refresh, user }) =>
        set({
          accessToken: access ?? null,
          refreshToken: refresh ?? null,
          user: user ?? null,
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setUser: (user) => set({ user }),

      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "kessia-auth",
      // localStorage only persists refreshToken + user; accessToken is short-lived
      // so we re-derive it from refresh on reload via the interceptor.
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
