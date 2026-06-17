import { api } from "./client";

// CRUD over the current writer's own experiences & publications.
export const profileApi = {
  listExperiences: () => api.get("/users/me/experiences/").then((r) => r.data),
  createExperience: (data) => api.post("/users/me/experiences/", data).then((r) => r.data),
  updateExperience: ({ id, data }) =>
    api.patch(`/users/me/experiences/${id}/`, data).then((r) => r.data),
  deleteExperience: (id) => api.delete(`/users/me/experiences/${id}/`).then((r) => r.data),

  listPublications: () => api.get("/users/me/publications/").then((r) => r.data),
  createPublication: (data) => api.post("/users/me/publications/", data).then((r) => r.data),
  updatePublication: ({ id, data }) =>
    api.patch(`/users/me/publications/${id}/`, data).then((r) => r.data),
  deletePublication: (id) => api.delete(`/users/me/publications/${id}/`).then((r) => r.data),

  listPortfolio: () => api.get("/users/me/portfolio/").then((r) => r.data),
  createPortfolio: (data) => api.post("/users/me/portfolio/", data).then((r) => r.data),
  updatePortfolio: ({ id, data }) =>
    api.patch(`/users/me/portfolio/${id}/`, data).then((r) => r.data),
  deletePortfolio: (id) => api.delete(`/users/me/portfolio/${id}/`).then((r) => r.data),
};
