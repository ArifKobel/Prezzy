import { Check } from "lucide-react";
import { LiveDot } from "@/components/interact/live-dot";
import { useInteractSession } from "@/components/interact/session-context";

export function WaitingRoom() {
  const { participantName } = useInteractSession();

  return (
    <div className="flex flex-col items-center gap-4 border border-border bg-card px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center bg-primary text-primary-foreground">
        <Check className="size-6" />
      </div>
      <p className="font-display text-xl font-extrabold tracking-tight text-foreground">
        You're in, {participantName}<span className="text-primary">.</span>
      </p>
      <p className="font-sans text-sm text-muted-foreground">
        The presentation hasn't started yet. Hang tight...
      </p>
      <LiveDot />
    </div>
  );
}
