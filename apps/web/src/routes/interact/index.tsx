import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { QrCode } from "lucide-react";

export const Route = createFileRoute("/interact/")({
  component: InteractLanding,
});

function InteractLanding() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length >= 4) {
      navigate({ to: "/interact/$sessionCode", params: { sessionCode: cleaned } });
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-surface px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="size-6" />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Prezzy
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Enter the session code to join
          </p>
        </div>

        <form onSubmit={handleJoin} className="flex w-full flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            maxLength={8}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <button
            type="submit"
            disabled={code.trim().length < 4}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Join Session
          </button>
        </form>

        <div className="flex items-center gap-2 text-muted-foreground/40">
          <QrCode className="size-4" />
          <span className="text-xs">Or scan the QR code shown on screen</span>
        </div>
      </div>
    </div>
  );
}
