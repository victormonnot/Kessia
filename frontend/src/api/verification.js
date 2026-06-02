import { api } from "./client";

export const verificationApi = {
  list: () => api.get("/verification/").then((r) => r.data),
  create: (payload) => api.post("/verification/", payload).then((r) => r.data),
};
