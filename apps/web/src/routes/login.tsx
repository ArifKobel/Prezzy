import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DemoButton from "@/components/demo-button";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { meQueryOptions } from "@/lib/api/auth";

export const Route = createFileRoute("/login")({
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>): { error?: string } =>
    typeof search.error === "string" ? { error: search.error } : {},
  loader: async ({ context: { queryClient } }) => {
    const user = await queryClient.ensureQueryData(meQueryOptions).catch(() => null);
    if (user) throw redirect({ to: "/dashboard" });
  },
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { error } = Route.useSearch();
  useEffect(() => {
    if (error === "google") toast.error("Google sign in failed");
  }, [error]);

  return (
    <div className="flex h-full flex-col bg-surface">
      <nav className="flex items-center justify-between border-b border-border px-8 py-4">
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Prezzy<span className="text-primary">.</span>
        </Link>
      </nav>

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-8 py-10">
        <div className="w-full max-w-sm">
          {mode === "signin" ? (
            <SignInForm onSwitchToSignUp={() => setMode("signup")} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setMode("signin")} />
          )}
          <p className="mt-4 text-center font-sans text-sm text-muted-foreground">
            Just looking around?{" "}
            <DemoButton className="font-semibold text-primary hover:underline disabled:opacity-40">
              Try the demo
            </DemoButton>
          </p>
          <div className="mt-10 flex items-center justify-center gap-6 font-sans text-[11px] text-muted-foreground/50">
            <span>© 2026 Prezzy. All rights reserved.</span>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
