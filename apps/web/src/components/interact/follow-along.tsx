import { LiveDot } from "@/components/interact/live-dot";
import { useInteractSession } from "@/components/interact/session-context";

export function FollowAlong() {
  const { theme: t } = useInteractSession();

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="h-px w-12" style={{ backgroundColor: t.muted, opacity: 0.4 }} />
      <p className="text-sm" style={{ color: t.muted }}>
        Following along — interactive content will appear here when the presenter shows it.
      </p>
      <LiveDot color={t.accent} />
    </div>
  );
}
