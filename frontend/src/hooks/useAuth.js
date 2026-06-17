import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: authApi.me,
    // Enabled once a silent refresh (or login) has populated the access token.
    enabled: Boolean(accessToken),
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }) => authApi.login(email, password),
    onSuccess: async (data) => {
      setAuth({ access: data.access });
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
      setAuth({ access: data.access, user: data.user });
      qc.setQueryData(["currentUser"], data.user);
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // Ignore: we clear local state regardless.
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

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email) => authApi.requestPasswordReset(email),
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: authApi.confirmPasswordReset,
  });
}

export function useVerifyEmail() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => authApi.verifyEmail(payload),
    onSuccess: async () => {
      // If someone is logged in, re-sync their profile so the banner clears.
      if (useAuthStore.getState().accessToken) {
        const me = await authApi.me();
        setUser(me);
        qc.setQueryData(["currentUser"], me);
      }
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: authApi.resendVerification,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload) => authApi.changePassword(payload),
  });
}

export function useChangeEmail() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => authApi.changeEmail(payload),
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(["currentUser"], user);
    },
  });
}

export function useDeleteAccount() {
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => authApi.deleteAccount(payload),
    onSuccess: () => {
      clear();
      qc.clear();
    },
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(["currentUser"], user);
    },
  });
}
