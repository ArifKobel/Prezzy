import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { meQueryOptions } from "@/lib/api/auth";

export const Route = createFileRoute("/login")({
  component: AuthPage,
  loader: async ({ context: { queryClient } }) => {
    const user = await queryClient.ensureQueryData(meQueryOptions).catch(() => null);
    if (user) throw redirect({ to: "/dashboard" });
  },
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

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
          <p className="mt-10 text-center font-sans text-[11px] text-muted-foreground/50">
            © 2026 Prezzy. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
