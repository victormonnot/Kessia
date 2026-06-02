import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { messagingApi } from "@/api/messaging";

// Polling keeps threads feeling live until WebSockets land (Phase 11).
export function useConversations(enabled = true) {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: messagingApi.listConversations,
    enabled,
    refetchInterval: enabled ? 8000 : false,
  });
}

export function useConversation(id) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => messagingApi.getConversation(id),
    enabled: Boolean(id),
  });
}

export function useMessages(conversationId) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagingApi.listMessages(conversationId),
    enabled: Boolean(conversationId),
    refetchInterval: 5000,
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: messagingApi.createConversation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useSendMessage(conversationId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => messagingApi.sendMessage(conversationId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
