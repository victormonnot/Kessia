import { api } from "./client";

export const ordersApi = {
  list: (params = {}) => api.get("/orders/", { params }).then((r) => r.data),

  create: (payload) => api.post("/orders/", payload).then((r) => r.data),

  retrieve: (id) => api.get(`/orders/${id}/`).then((r) => r.data),

  earnings: () => api.get("/orders/earnings/").then((r) => r.data),

  updateStatus: (id, status) =>
    api.patch(`/orders/${id}/`, { status }).then((r) => r.data),

  // Writer uploads the finished work (sets the order to "delivered").
  // Content-Type is left undefined so the browser sets the multipart boundary.
  uploadDeliverable: (id, formData) =>
    api
      .post(`/orders/${id}/deliverables/`, formData, {
        headers: { "Content-Type": undefined },
      })
      .then((r) => r.data),

  // Doctor downloads a delivered file (auth-gated by the backend).
  downloadDeliverable: (orderId, deliverableId) =>
    api
      .get(`/orders/${orderId}/deliverables/${deliverableId}/download/`, {
        responseType: "blob",
      })
      .then((r) => r.data),
};
