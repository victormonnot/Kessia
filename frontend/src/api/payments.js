import { api } from "./client";

export const paymentsApi = {
  connectStatus: () => api.get("/payments/connect/status/").then((r) => r.data),

  onboard: () => api.post("/payments/connect/onboard/").then((r) => r.data),

  pay: (orderId) => api.post(`/payments/orders/${orderId}/pay/`).then((r) => r.data),

  confirm: (orderId) => api.post(`/payments/orders/${orderId}/confirm/`).then((r) => r.data),
};
