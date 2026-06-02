import { api } from "./client";

export const messagingApi = {
  listConversations: () => api.get("/conversations/").then((r) => r.data),

  getConversation: (id) => api.get(`/conversations/${id}/`).then((r) => r.data),

  createConversation: (payload) => api.post("/conversations/", payload).then((r) => r.data),

  listMessages: (id) => api.get(`/conversations/${id}/messages/`).then((r) => r.data),

  sendMessage: (id, body) =>
    api.post(`/conversations/${id}/messages/`, { body }).then((r) => r.data),
};
