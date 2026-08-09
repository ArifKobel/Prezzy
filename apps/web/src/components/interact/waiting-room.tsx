import { Check } from "lucide-react";
import { LiveDot } from "@/components/interact/live-dot";
import { useInteractSession } from "@/components/interact/session-context";

export function WaitingRoom() {
  const { participantName } = useInteractSession();

  return (
    <div className="flex flex-col items-center gap-4 bg-[#1b1e22] px-6 py-12 text-center shadow-[0_10px_30px_rgb(27_30_34_/_0.3)]">
      <div className="flex size-14 items-center justify-center bg-primary text-primary-foreground">
        <Check className="size-6" />
      </div>
      <p className="font-display text-2xl font-extrabold tracking-tight text-[#f6f3ed]">
        You're in, {participantName}<span className="text-primary">.</span>
      </p>
      <p className="font-sans text-sm text-[#f6f3ed]/60">
        The presentation hasn't started yet. Hang tight...
      </p>
      <LiveDot />
    </div>
  );
}
