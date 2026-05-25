import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { proposalsApi, requestsApi } from "@/api/requests";

export function useRequests(params = {}) {
  return useQuery({
    queryKey: ["requests", params],
    queryFn: () => requestsApi.list(params),
    keepPreviousData: true,
  });
}

export function useRequest(id) {
  return useQuery({
    queryKey: ["request", id],
    queryFn: () => requestsApi.retrieve(id),
    enabled: Boolean(id),
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}

export function useUpdateRequest(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => requestsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["request", id] });
    },
  });
}

export function useDeleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}

export function useProposals(requestId) {
  return useQuery({
    queryKey: ["proposals", requestId],
    queryFn: () => requestsApi.listProposals(requestId),
    enabled: Boolean(requestId),
  });
}

export function useCreateProposal(requestId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => requestsApi.createProposal(requestId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals", requestId] }),
  });
}

export function useUpdateProposal(requestId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => proposalsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals", requestId] }),
  });
}

export function useDeleteProposal(requestId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: proposalsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals", requestId] }),
  });
}
