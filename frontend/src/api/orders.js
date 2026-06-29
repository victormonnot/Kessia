import { api } from "./client";

export const ordersApi = {
  list: (params = {}) => api.get("/orders/", { params }).then((r) => r.data),

  create: (payload) => api.post("/orders/", payload).then((r) => r.data),

  retrieve: (id) => api.get(`/orders/${id}/`).then((r) => r.data),

  // The (deduped) conversation scoped to this order, created on first access.
  getConversation: (id) => api.get(`/orders/${id}/conversation/`).then((r) => r.data),

  earnings: () => api.get("/orders/earnings/").then((r) => r.data),

  updateStatus: (id, status) => api.patch(`/orders/${id}/`, { status }).then((r) => r.data),

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

  // Brief/source documents shared on the order (either party, while it's live).
  listAttachments: (id) => api.get(`/orders/${id}/attachments/`).then((r) => r.data),

  uploadAttachment: (id, formData) =>
    api
      .post(`/orders/${id}/attachments/`, formData, {
        headers: { "Content-Type": undefined },
      })
      .then((r) => r.data),

  downloadAttachment: (orderId, attachmentId) =>
    api
      .get(`/orders/${orderId}/attachments/${attachmentId}/download/`, {
        responseType: "blob",
      })
      .then((r) => r.data),
};
