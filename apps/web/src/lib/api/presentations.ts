import type { FirstSlidePreview, Presentation, PresentationTheme, SlideElement } from "@Prezzy/shared";
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

export function usePresentationElements(presentationId: string | null) {
  return useQuery({
    queryKey: ["presentationElements", presentationId],
    queryFn: () => apiFetch<SlideElement[]>(`/presentations/${presentationId}/elements`),
    enabled: !!presentationId,
  });
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

export function useUpdatePresentationTitle() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { id: string; title: string }) =>
      apiFetch<Presentation>(`/presentations/${args.id}`, { method: "PATCH", body: { title: args.title } }),
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({ queryKey: ["presentation", args.id] });
      queryClient.invalidateQueries({ queryKey: ["presentations"] });
    },
  });
  return mutation.mutateAsync;
}

export function useUpdatePresentationTheme() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { id: string; theme: { [K in keyof PresentationTheme]?: PresentationTheme[K] | null } }) =>
      apiFetch<Presentation>(`/presentations/${args.id}`, { method: "PATCH", body: { theme: args.theme } }),
    onSuccess: (_, args) =>
      queryClient.invalidateQueries({ queryKey: ["presentation", args.id] }),
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
