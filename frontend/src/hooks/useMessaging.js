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

// Fetches an auth-gated attachment as an object URL, cached for the session so
// thread polling / re-renders don't re-download it. `enabled` gates lazy loads:
// images load immediately; PDFs (and other files) only when previewed.
export function useAttachmentUrl(conversationId, messageId, enabled) {
  return useQuery({
    queryKey: ["attachment", conversationId, messageId],
    queryFn: async () => {
      const blob = await messagingApi.downloadAttachment(conversationId, messageId);
      return URL.createObjectURL(blob);
    },
    enabled: Boolean(enabled && conversationId && messageId),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });
}

export function useSendMessage(conversationId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => messagingApi.sendMessage(conversationId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
