import { Check } from "lucide-react";
import { LiveDot } from "@/components/interact/live-dot";

export function WaitingRoom({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#f3f4f3]">
        <Check className="size-7 text-[#6b8e7b]" />
      </div>
      <p className="font-display text-base font-bold text-[#2f3333]">
        You're in, {name}!
      </p>
      <p className="font-sans text-sm text-[#2f3333]/50">
        The presentation hasn't started yet. Hang tight...
      </p>
      <LiveDot />
    </div>
  );
}
