import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { meQueryOptions } from "@/lib/api/auth";

export const Route = createFileRoute("/")({
  component: LandingPage,
  loader: async ({ context: { queryClient } }) => {
    const user = await queryClient.ensureQueryData(meQueryOptions).catch(() => null);
    if (user) throw redirect({ to: "/dashboard" });
  },
});

function LandingPage() {
  return (
    <div className="flex h-full flex-col bg-surface">
      <nav className="flex shrink-0 items-center justify-between border-b border-border px-8 py-4">
        <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Prezzy<span className="text-primary">.</span>
        </span>
        <Link
          to="/login"
          className="font-sans text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </nav>

      <main className="flex flex-1 flex-col justify-center px-8">
        <div className="mx-auto w-full max-w-[1180px]">
          <h1 className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both font-display text-[clamp(3.5rem,9vw,7.5rem)] font-extrabold leading-[0.95] tracking-tight text-foreground duration-500">
            Your Creative
            <br />
            Workshop<span className="text-primary">.</span>
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-8 max-w-md font-sans text-base leading-relaxed text-muted-foreground delay-150 duration-500">
            Craft presentations that tell stories. Beautiful slides, live audience interaction.
          </p>
          <Link
            to="/login"
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-10 inline-flex items-center gap-2 bg-primary px-6 py-3 font-sans text-xs font-bold text-primary-foreground transition-colors delay-300 duration-500 hover:bg-primary-dim"
          >
            Start creating <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </main>

      <footer className="shrink-0 border-t border-border px-8 py-4">
        <p className="font-sans text-[11px] text-muted-foreground/50">
          © 2026 Prezzy. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
