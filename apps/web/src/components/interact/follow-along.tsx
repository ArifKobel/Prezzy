import { LiveDot } from "@/components/interact/live-dot";

export function FollowAlong() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="h-px w-12 bg-[#2f3333]/10" />
      <p className="font-sans text-sm text-[#2f3333]/40">
        Following along — interactive content will appear here when the
        presenter shows it.
      </p>
      <LiveDot />
    </div>
  );
}
