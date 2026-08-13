import { apiFetch } from "@/lib/api/client";

export interface OAuthInteraction {
  uid: string;
  prompt: string;
  client: { id: string; name: string };
  scopes: string[];
  user: { id: string; email: string; name: string } | null;
}

export const oauthInteraction = (uid: string) =>
  apiFetch<OAuthInteraction>(`/oauth-interactions/${encodeURIComponent(uid)}`);
