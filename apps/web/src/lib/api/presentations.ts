import type { FirstSlidePreview, Presentation } from "@Prezzy/shared";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export function usePresentation(id: string | null) {
  return useQuery({
    queryKey: ["presentation", id],
    queryFn: () => apiFetch<Presentation | null>(`/presentations/${id}`, { nullOn404: true }),
    enabled: !!id,
  });
}

export const presentationsQueryOptions = queryOptions({
  queryKey: ["presentations"],
  queryFn: () => apiFetch<Presentation[]>("/presentations"),
});

export function usePresentations() {
  return useQuery(presentationsQueryOptions);
}

export function firstSlideElementsQueryOptions(presentationId: string) {
  return queryOptions({
    queryKey: ["firstSlideElements", presentationId],
    queryFn: () => apiFetch<FirstSlidePreview>(`/presentations/${presentationId}/first-slide-elements`),
  });
}

export function useFirstSlideElements(presentationId: string | null) {
  return useQuery({
    ...firstSlideElementsQueryOptions(presentationId ?? ""),
    enabled: !!presentationId,
  });
}

export function useCreatePresentation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { title: string }) =>
      apiFetch<Presentation>("/presentations", { method: "POST", body: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presentations"] }),
  });
  return mutation.mutateAsync;
}

export function useRemovePresentation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { id: string }) =>
      apiFetch<void>(`/presentations/${args.id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presentations"] }),
  });
  return mutation.mutateAsync;
}
