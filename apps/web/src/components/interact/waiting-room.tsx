import { Check } from "lucide-react";
import { LiveDot } from "@/components/interact/live-dot";

export function WaitingRoom({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary-container">
        <Check className="size-7 text-[#4e8f6f]" />
      </div>
      <p className="font-display text-base font-bold text-foreground">
        You're in, {name}!
      </p>
      <p className="font-sans text-sm text-muted-foreground">
        The presentation hasn't started yet. Hang tight...
      </p>
      <LiveDot />
    </div>
  );
}
