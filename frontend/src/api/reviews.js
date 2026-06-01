import { api } from "./client";

export const reviewsApi = {
  create: (payload) => api.post("/reviews/", payload).then((r) => r.data),

  listByWriter: (writerId) =>
    api.get("/reviews/", { params: { writer: writerId } }).then((r) => r.data),
};
