import { useQuery } from "@tanstack/react-query";

import { writersApi } from "@/api/writers";

export function useWriter(id) {
  return useQuery({
    queryKey: ["writer", id],
    queryFn: () => writersApi.retrieve(id),
    enabled: Boolean(id),
  });
}
