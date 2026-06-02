import { api } from "./client";

export const listingsApi = {
  list: (params = {}) => api.get("/listings/", { params }).then((r) => r.data),

  retrieve: (id) => api.get(`/listings/${id}/`).then((r) => r.data),

  create: (payload) => api.post("/listings/", payload).then((r) => r.data),

  update: (id, payload) => api.patch(`/listings/${id}/`, payload).then((r) => r.data),

  remove: (id) => api.delete(`/listings/${id}/`).then((r) => r.data),
};
