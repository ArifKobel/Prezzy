import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { useEffect, useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <AuthGuard
      authenticated={<RedirectToDashboard />}
      unauthenticated={<AuthPage />}
      loading={
        <div className="flex h-full items-center justify-center bg-surface">
          <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      }
    />
  );
}

function RedirectToDashboard() {
  const navigate = useNavigate();
  useEffect(() => { navigate({ to: "/dashboard" }); }, [navigate]);
  return null;
}

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="flex h-full bg-surface">
      <div className="hidden w-[45%] flex-col justify-between bg-surface-container-low p-12 lg:flex">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="size-7" />
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">Prezzy</span>
          </div>
        </div>
        <div>
          <h1 className="font-display text-[2.5rem] font-bold leading-[1.15] tracking-tight text-foreground">
            Your Creative<br />
            <span className="italic text-primary">Workshop</span>
          </h1>
          <p className="mt-4 max-w-sm font-sans text-sm leading-relaxed text-muted-foreground">
            Craft presentations that tell stories. Beautiful slides, live audience interaction.
          </p>
        </div>
        <p className="font-sans text-[11px] text-muted-foreground/50">© 2026 Prezzy. All rights reserved.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="size-7" />
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">Prezzy</span>
          </div>

          {mode === "signin" ? (
            <SignInForm onSwitchToSignUp={() => setMode("signup")} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setMode("signin")} />
          )}
        </div>
      </div>
    </div>
  );
}
