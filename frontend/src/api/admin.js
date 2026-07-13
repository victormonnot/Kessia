import { api } from "./client";

export const adminApi = {
  stats: () => api.get("/admin/stats/").then((r) => r.data),

  users: (params = {}) => api.get("/admin/users/", { params }).then((r) => r.data),
  user: (id) => api.get(`/admin/users/${id}/`).then((r) => r.data),
  verifyUser: (id) => api.post(`/admin/users/${id}/verify/`).then((r) => r.data),
  unverifyUser: (id) => api.post(`/admin/users/${id}/unverify/`).then((r) => r.data),
  deleteUser: (id) => api.post(`/admin/users/${id}/delete/`).then((r) => r.data),

  listings: (params = {}) => api.get("/admin/listings/", { params }).then((r) => r.data),
  removeListing: (id) => api.post(`/admin/listings/${id}/remove/`).then((r) => r.data),
  restoreListing: (id) => api.post(`/admin/listings/${id}/restore/`).then((r) => r.data),

  requests: (params = {}) => api.get("/admin/requests/", { params }).then((r) => r.data),
  removeRequest: (id) => api.post(`/admin/requests/${id}/remove/`).then((r) => r.data),
  restoreRequest: (id) => api.post(`/admin/requests/${id}/restore/`).then((r) => r.data),

  reviews: (params = {}) => api.get("/admin/reviews/", { params }).then((r) => r.data),
  removeReview: (id) => api.post(`/admin/reviews/${id}/remove/`).then((r) => r.data),
  restoreReview: (id) => api.post(`/admin/reviews/${id}/restore/`).then((r) => r.data),

  orders: (params = {}) => api.get("/admin/orders/", { params }).then((r) => r.data),
  order: (id) => api.get(`/admin/orders/${id}/`).then((r) => r.data),
  refundOrder: (id) => api.post(`/admin/orders/${id}/refund/`).then((r) => r.data),
  releaseOrder: (id) => api.post(`/admin/orders/${id}/release/`).then((r) => r.data),

  reports: (params = {}) => api.get("/admin/reports/", { params }).then((r) => r.data),
  resolveReport: (id) => api.post(`/admin/reports/${id}/resolve/`).then((r) => r.data),
  dismissReport: (id) => api.post(`/admin/reports/${id}/dismiss/`).then((r) => r.data),

  auditLog: (params = {}) => api.get("/admin/audit-log/", { params }).then((r) => r.data),
};

// User-facing: report a piece of content or a user to the moderators.
export const reportContent = (payload) => api.post("/reports/", payload).then((r) => r.data);
