import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { verificationApi } from "@/api/verification";

export function useMyVerifications() {
  return useQuery({ queryKey: ["verification"], queryFn: verificationApi.list });
}

export function useRequestVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verificationApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["verification"] }),
  });
}
