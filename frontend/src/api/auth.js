import { api } from "./client";

export const authApi = {
  register: (payload) => api.post("/auth/register/", payload).then((r) => r.data),

  login: (email, password) => api.post("/auth/login/", { email, password }).then((r) => r.data),

  logout: () => api.post("/auth/logout/").then((r) => r.data),

  requestPasswordReset: (email) =>
    api.post("/auth/password/reset/", { email }).then((r) => r.data),

  confirmPasswordReset: (payload) =>
    api.post("/auth/password/reset/confirm/", payload).then((r) => r.data),

  verifyEmail: (payload) =>
    api.post("/auth/email/verify/", payload).then((r) => r.data),

  resendVerification: () =>
    api.post("/auth/email/verify/resend/").then((r) => r.data),

  me: () => api.get("/users/me/").then((r) => r.data),

  updateMe: (payload) => api.patch("/users/me/", payload).then((r) => r.data),

  activateWriter: () => api.post("/users/me/activate-writer/").then((r) => r.data),
};
