import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listingsApi } from "@/api/listings";
import { DEMO_MODE, demoListingsResponse } from "@/lib/demoData";

export function useListings(params = {}) {
  return useQuery({
    queryKey: ["listings", params],
    // Mode démo : fixtures locales, aucun appel réseau (landing hébergée sans
    // backend). Voir lib/demoData.js.
    queryFn: DEMO_MODE
      ? () => demoListingsResponse(params)
      : () => listingsApi.list(params),
    keepPreviousData: true,
  });
}

export function useListing(id) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.retrieve(id),
    enabled: Boolean(id),
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: listingsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}

export function useUpdateListing(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => listingsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["listing", id] });
    },
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: listingsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}
