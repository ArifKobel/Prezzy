import type { SlideElement } from "@Prezzy/shared";
import { Trophy } from "lucide-react";
import { useLeaderboard } from "@/lib/api/interact";
import { useInteractSession } from "@/components/interact/session-context";

export function LeaderboardInteraction(_props: { element: SlideElement }) {
  const { presentationId, participantName } = useInteractSession();
  const { data: entries } = useLeaderboard(presentationId);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
        <Trophy className="size-3.5" /> Leaderboard
      </p>

      {!entries || entries.length === 0 ? (
        <p className="font-sans text-sm text-muted-foreground">
          No scores yet — answer quizzes to get on the board.
        </p>
      ) : (
        <div className="flex w-full flex-col gap-1.5">
          {entries.slice(0, 10).map((entry, i) => {
            const isMe = entry.name === participantName;
            return (
              <div
                key={`${entry.name}-${i}`}
                className={`flex items-center gap-3 border px-3.5 py-2.5 ${
                  isMe
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                }`}
              >
                <span
                  className={`w-6 shrink-0 font-display text-sm font-extrabold tabular-nums ${
                    i < 3 && !isMe ? "text-primary" : ""
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-sans text-sm font-semibold">
                  {entry.name}
                  {isMe && <span className="ml-1.5 text-xs opacity-70">(you)</span>}
                </span>
                <span className="shrink-0 font-display text-sm font-extrabold tabular-nums">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
