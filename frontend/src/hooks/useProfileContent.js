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

export function usePortfolio(enabled = true) {
  return useQuery({
    queryKey: ["me-portfolio"],
    queryFn: profileApi.listPortfolio,
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
export const useUpdateExperience = () =>
  useContentMutation(profileApi.updateExperience, "me-experiences");
export const useDeleteExperience = () =>
  useContentMutation(profileApi.deleteExperience, "me-experiences");
export const useCreatePublication = () =>
  useContentMutation(profileApi.createPublication, "me-publications");
export const useUpdatePublication = () =>
  useContentMutation(profileApi.updatePublication, "me-publications");
export const useDeletePublication = () =>
  useContentMutation(profileApi.deletePublication, "me-publications");
export const useCreatePortfolio = () =>
  useContentMutation(profileApi.createPortfolio, "me-portfolio");
export const useUpdatePortfolio = () =>
  useContentMutation(profileApi.updatePortfolio, "me-portfolio");
export const useDeletePortfolio = () =>
  useContentMutation(profileApi.deletePortfolio, "me-portfolio");
