import { api } from "./client";

export const messagingApi = {
  listConversations: () => api.get("/conversations/").then((r) => r.data),

  getConversation: (id) => api.get(`/conversations/${id}/`).then((r) => r.data),

  createConversation: (payload) => api.post("/conversations/", payload).then((r) => r.data),

  listMessages: (id) => api.get(`/conversations/${id}/messages/`).then((r) => r.data),

  // Sends text, a file attachment, or both. With a file we post multipart and
  // let the browser set the Content-Type boundary.
  sendMessage: (id, { body = "", attachment = null } = {}) => {
    if (attachment) {
      const form = new FormData();
      if (body) form.append("body", body);
      form.append("attachment", attachment);
      return api
        .post(`/conversations/${id}/messages/`, form, {
          headers: { "Content-Type": undefined },
        })
        .then((r) => r.data);
    }
    return api.post(`/conversations/${id}/messages/`, { body }).then((r) => r.data);
  },

  // Auth-gated attachment download (participants only).
  downloadAttachment: (conversationId, messageId) =>
    api
      .get(`/conversations/${conversationId}/messages/${messageId}/download/`, {
        responseType: "blob",
      })
      .then((r) => r.data),
};
