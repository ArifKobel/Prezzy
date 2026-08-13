import { env } from "@Prezzy/env/web";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { OAuthInteraction } from "@/lib/api/oauth";
import { oauthInteraction } from "@/lib/api/oauth";

export const Route = createFileRoute("/oauth/authorize")({
  validateSearch: (search: Record<string, unknown>): { uid: string } => ({
    uid: typeof search.uid === "string" ? search.uid : "",
  }),
  component: OAuthAuthorizePage,
});

function OAuthAuthorizePage() {
  const { uid } = Route.useSearch();
  const [interaction, setInteraction] = useState<OAuthInteraction | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!uid) {
      setFailed(true);
      return;
    }
    oauthInteraction(uid).then(setInteraction).catch(() => setFailed(true));
  }, [uid]);

  useEffect(() => {
    if (interaction?.prompt === "login" && !interaction.user) {
      window.location.assign(`/login?oauth=${encodeURIComponent(uid)}`);
    }
  }, [interaction, uid]);

  if (failed) return <OAuthMessage title="Authorization request expired" />;
  if (!interaction) return <OAuthMessage title="Loading authorization request" />;

  const action = `${env.VITE_API_URL}/api/oauth-interactions/${encodeURIComponent(uid)}`;
  const permissions = interaction.scopes.filter((scope) => scope.startsWith("presentations:"));

  return (
    <main className="flex min-h-full items-center justify-center bg-surface px-6 py-12">
      <section className="w-full max-w-lg border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-xl">
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Prezzy<span className="text-primary">.</span>
        </Link>
        <p className="mt-8 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          MCP authorization
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground">
          Allow {interaction.client.name} to use Prezzy?
        </h1>
        <p className="mt-3 font-sans text-sm leading-6 text-muted-foreground">
          Signed in as {interaction.user?.email}. The client will be able to act on your presentations through MCP.
        </p>
        <div className="mt-8 border-y border-outline-variant/20 py-5">
          {permissions.map((scope) => (
            <p key={scope} className="font-sans text-sm text-foreground">
              {scope === "presentations:write" ? "View and edit presentations" : "View presentations"}
            </p>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <form method="post" action={action} className="flex-1">
            <input type="hidden" name="decision" value="deny" />
            <button type="submit" className="w-full border border-outline-variant/30 px-4 py-3 font-sans text-xs font-bold text-foreground">
              Deny
            </button>
          </form>
          <form method="post" action={action} className="flex-1">
            <input type="hidden" name="decision" value="approve" />
            <button type="submit" className="w-full bg-primary px-4 py-3 font-sans text-xs font-bold text-primary-foreground">
              Allow
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function OAuthMessage({ title }: { title: string }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-surface px-6">
      <p className="font-display text-xl font-bold text-foreground">{title}</p>
    </main>
  );
}
