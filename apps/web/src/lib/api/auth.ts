import type { User } from "@Prezzy/shared";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export const meQueryOptions = queryOptions({
  queryKey: ["auth", "me"],
  queryFn: () => apiFetch<User | null>("/auth/me"),
});

export function useMe() {
  return useQuery(meQueryOptions);
}

function useAuthMutation<TArgs>(path: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: TArgs) => apiFetch<User | null>(path, { method: "POST", body: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth"], refetchType: "all" }),
  });
  return mutation.mutateAsync;
}

export function useSignup() {
  return useAuthMutation<{ name: string; email: string; password: string }>("/auth/signup");
}

export function useLogin() {
  return useAuthMutation<{ email: string; password: string }>("/auth/login");
}

export function useLogout() {
  return useAuthMutation<void>("/auth/logout");
}

export function useStartDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ user: User; presentationId: string }>("/auth/demo", { method: "POST" }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(meQueryOptions.queryKey, user);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { name: string }) =>
      apiFetch<User>("/auth/profile", { method: "PATCH", body: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth"] }),
  });
  return mutation.mutateAsync;
}

export function useChangePassword() {
  const mutation = useMutation({
    mutationFn: (args: { currentPassword: string; newPassword: string }) =>
      apiFetch<void>("/auth/change-password", { method: "POST", body: args }),
  });
  return mutation.mutateAsync;
}
