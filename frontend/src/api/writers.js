import { api } from "./client";

export const writersApi = {
  retrieve: (id) => api.get(`/writers/${id}/`).then((r) => r.data),
};
