import { api } from "./client";

export const ordersApi = {
  list: (params = {}) => api.get("/orders/", { params }).then((r) => r.data),

  create: (payload) => api.post("/orders/", payload).then((r) => r.data),

  retrieve: (id) => api.get(`/orders/${id}/`).then((r) => r.data),

  updateStatus: (id, status) =>
    api.patch(`/orders/${id}/`, { status }).then((r) => r.data),
};
