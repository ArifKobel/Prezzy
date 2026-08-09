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
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            Prezzy<span className="text-primary">.</span>
          </span>
          <p className="text-center font-sans text-sm text-muted-foreground">
            Enter the session code to join
          </p>
        </div>

        <form onSubmit={handleJoin} className="flex w-full flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            maxLength={8}
            autoFocus
            className="w-full border border-border bg-card px-4 py-3.5 text-center font-mono text-2xl font-bold tracking-[0.3em] text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-primary"
          />
          <button
            type="submit"
            disabled={code.trim().length < 4}
            className="w-full bg-primary py-3.5 font-sans text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dim disabled:opacity-40"
          >
            Join Session
          </button>
        </form>

        <div className="flex items-center gap-2 text-muted-foreground/50">
          <QrCode className="size-4" />
          <span className="font-sans text-xs">Or scan the QR code shown on screen</span>
        </div>
      </div>
    </div>
  );
}
