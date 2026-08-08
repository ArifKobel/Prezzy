import { LiveDot } from "@/components/interact/live-dot";

export function FollowAlong() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="h-px w-12 bg-outline-variant/30" />
      <p className="font-sans text-sm text-muted-foreground">
        Following along — interactive content will appear here when the
        presenter shows it.
      </p>
      <LiveDot />
    </div>
  );
}
