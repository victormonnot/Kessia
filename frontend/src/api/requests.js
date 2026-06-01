import { api } from "./client";

export const requestsApi = {
  list: (params = {}) => api.get("/requests/", { params }).then((r) => r.data),
  retrieve: (id) => api.get(`/requests/${id}/`).then((r) => r.data),
  create: (payload) => api.post("/requests/", payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/requests/${id}/`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/requests/${id}/`).then((r) => r.data),
  listProposals: (id) => api.get(`/requests/${id}/proposals/`).then((r) => r.data),
  createProposal: (id, payload) =>
    api.post(`/requests/${id}/proposals/`, payload).then((r) => r.data),
};

export const proposalsApi = {
  // Proposals the current user is involved in (own as writer, or on own requests).
  list: () => api.get("/proposals/").then((r) => r.data),
  update: (id, payload) => api.patch(`/proposals/${id}/`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/proposals/${id}/`).then((r) => r.data),
};
