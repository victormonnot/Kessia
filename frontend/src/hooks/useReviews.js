import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reviewsApi } from "@/api/reviews";

export function useWriterReviews(writerId) {
  return useQuery({
    queryKey: ["reviews", writerId],
    queryFn: () => reviewsApi.listByWriter(writerId),
    enabled: Boolean(writerId),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
