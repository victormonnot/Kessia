import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { profileApi } from "@/api/profile";

// DRF list endpoints are paginated ({results}) but a writer rarely exceeds one
// page; normalise to a plain array either way.
const toArray = (data) => data?.results ?? data ?? [];

export function useExperiences(enabled = true) {
  return useQuery({
    queryKey: ["me-experiences"],
    queryFn: profileApi.listExperiences,
    select: toArray,
    enabled,
  });
}

export function usePublications(enabled = true) {
  return useQuery({
    queryKey: ["me-publications"],
    queryFn: profileApi.listPublications,
    select: toArray,
    enabled,
  });
}

function useContentMutation(mutationFn, queryKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });
}

export const useCreateExperience = () =>
  useContentMutation(profileApi.createExperience, "me-experiences");
export const useDeleteExperience = () =>
  useContentMutation(profileApi.deleteExperience, "me-experiences");
export const useCreatePublication = () =>
  useContentMutation(profileApi.createPublication, "me-publications");
export const useDeletePublication = () =>
  useContentMutation(profileApi.deletePublication, "me-publications");
