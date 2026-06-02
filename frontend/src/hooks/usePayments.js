import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { paymentsApi } from "@/api/payments";

export function useConnectStatus(enabled = true) {
  return useQuery({
    queryKey: ["connectStatus"],
    queryFn: paymentsApi.connectStatus,
    enabled,
  });
}

export function useOnboard() {
  return useMutation({ mutationFn: paymentsApi.onboard });
}

export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => paymentsApi.confirm(orderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
