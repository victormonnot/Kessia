import { api } from "./client";

export const favoritesApi = {
  // { listings: [...], requests: [...] }
  list: () => api.get("/favorites/").then((r) => r.data),
  // payload: { listing: id } XOR { request: id } → { favorited: bool }
  toggle: (payload) => api.post("/favorites/toggle/", payload).then((r) => r.data),
};
