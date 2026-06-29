import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ordersApi } from "@/api/orders";

export function useOrders(params = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersApi.list(params),
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.retrieve(id),
    enabled: Boolean(id),
  });
}

export function useEarnings() {
  return useQuery({ queryKey: ["earnings"], queryFn: ordersApi.earnings });
}

export function useOrderConversation(id) {
  return useQuery({
    queryKey: ["order-conversation", id],
    queryFn: () => ordersApi.getConversation(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => ordersApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUploadDeliverable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => ordersApi.uploadDeliverable(id, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUploadOrderAttachment(orderId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => ordersApi.uploadAttachment(orderId, formData),
    // The order detail embeds its attachments, so refresh the open workspace.
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", orderId] }),
  });
}
