import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { favoritesApi } from "@/api/favorites";

export function useFavorites(enabled = true) {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesApi.list,
    enabled,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: favoritesApi.toggle,
    // Refresh the "Mes favoris" page; the buttons themselves update optimistically
    // so we don't refetch every listing/request grid on each click.
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}
