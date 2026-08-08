import type { AudienceResponse, LeaderboardEntry, Presentation, Slide } from "@Prezzy/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export function usePresentationByJoinCode(code: string | null) {
  return useQuery({
    queryKey: ["join", code],
    queryFn: () => apiFetch<Presentation | null>(`/join/${code}`, { nullOn404: true }),
    enabled: !!code,
  });
}

export function useResponses(elementId: string | null) {
  return useQuery({
    queryKey: ["responses", elementId],
    queryFn: () => apiFetch<AudienceResponse[]>(`/elements/${elementId}/responses`),
    enabled: !!elementId,
  });
}

export function useLeaderboard(presentationId: string | null) {
  return useQuery({
    queryKey: ["leaderboard", presentationId],
    queryFn: () => apiFetch<LeaderboardEntry[]>(`/presentations/${presentationId}/leaderboard`),
    enabled: !!presentationId,
  });
}

export function useParticipantCount(presentationId: string | null) {
  return useQuery({
    queryKey: ["participantCount", presentationId],
    queryFn: () =>
      apiFetch<{ count: number }>(`/presentations/${presentationId}/participant-count`).then(
        (r) => r.count,
      ),
    enabled: !!presentationId,
  });
}

export function useSubmitResponse() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: {
      elementId: string;
      participantId: string;
      participantName?: string;
      value: string;
    }) => apiFetch<AudienceResponse>("/responses", { method: "POST", body: args }),
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({ queryKey: ["responses", args.elementId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
  return mutation.mutateAsync;
}

export function useHeartbeat() {
  const mutation = useMutation({
    mutationFn: (args: { joinCode: string; participantId: string; participantName?: string }) =>
      apiFetch<void>(`/join/${args.joinCode}/heartbeat`, {
        method: "POST",
        body: { participantId: args.participantId, participantName: args.participantName },
      }),
  });
  return mutation.mutateAsync;
}

export function useSetLiveSlide() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { presentationId: string; slideId: string | null }) =>
      apiFetch<void>(`/presentations/${args.presentationId}/live-slide`, {
        method: "POST",
        body: { slideId: args.slideId },
      }),
    onSuccess: (_, args) =>
      queryClient.invalidateQueries({ queryKey: ["presentation", args.presentationId] }),
  });
  return mutation.mutateAsync;
}

export function useSetQuizPhase() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: {
      presentationId: string;
      elementId: string;
      phase: "question" | "answering" | "results";
    }) =>
      apiFetch<void>(`/presentations/${args.presentationId}/quiz`, {
        method: "POST",
        body: { elementId: args.elementId, phase: args.phase },
      }),
    onSuccess: (_, args) =>
      queryClient.invalidateQueries({ queryKey: ["presentation", args.presentationId] }),
  });
  return mutation.mutateAsync;
}

export function useClearQuiz() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { presentationId: string }) =>
      apiFetch<void>(`/presentations/${args.presentationId}/quiz`, { method: "DELETE" }),
    onSuccess: (_, args) =>
      queryClient.invalidateQueries({ queryKey: ["presentation", args.presentationId] }),
  });
  return mutation.mutateAsync;
}

export function useClearAllResponses() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { presentationId: string }) =>
      apiFetch<{ deleted: number }>(`/presentations/${args.presentationId}/responses`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
  return mutation.mutateAsync;
}

export type { Slide };
