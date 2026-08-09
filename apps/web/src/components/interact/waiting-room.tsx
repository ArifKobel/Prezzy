import { Check } from "lucide-react";
import { LiveDot } from "@/components/interact/live-dot";
import { useInteractSession } from "@/components/interact/session-context";
import { contrastOn } from "@/lib/quiz-constants";

export function WaitingRoom() {
  const { theme: t, participantName } = useInteractSession();

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className="flex size-14 items-center justify-center"
        style={{ backgroundColor: t.accent, color: contrastOn(t.accent), borderRadius: t.radius * 2 }}
      >
        <Check className="size-6" />
      </div>
      <p className="text-lg font-bold" style={{ fontFamily: t.fontHeading, color: t.heading }}>
        You're in, {participantName}!
      </p>
      <p className="text-sm" style={{ color: t.muted }}>
        The presentation hasn't started yet. Hang tight...
      </p>
      <LiveDot color={t.accent} />
    </div>
  );
}
