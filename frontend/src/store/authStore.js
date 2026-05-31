import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      setAuth: ({ access, user }) =>
        set((state) => ({
          accessToken: access ?? state.accessToken,
          user: user ?? state.user,
        })),

      setAccessToken: (accessToken) => set({ accessToken }),

      setUser: (user) => set({ user }),

      clear: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "kessia-auth",
      // The refresh token now lives in an httpOnly cookie and the access token
      // stays in memory only. We persist just `user` for instant UI on reload;
      // a silent refresh re-derives the access token from the cookie at startup.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
