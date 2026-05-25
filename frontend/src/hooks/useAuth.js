import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: authApi.me,
    enabled: Boolean(accessToken || refreshToken),
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }) => authApi.login(email, password),
    onSuccess: async (data) => {
      setAuth({ access: data.access, refresh: data.refresh });
      const me = await authApi.me();
      useAuthStore.getState().setUser(me);
      qc.setQueryData(["currentUser"], me);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth({ access: data.access, refresh: data.refresh, user: data.user });
      qc.setQueryData(["currentUser"], data.user);
    },
  });
}

export function useLogout() {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch {
          // ignore; we clear local state anyway
        }
      }
    },
    onSettled: () => {
      clear();
      qc.clear();
    },
  });
}

export function useActivateWriter() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.activateWriter,
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(["currentUser"], user);
    },
  });
}
