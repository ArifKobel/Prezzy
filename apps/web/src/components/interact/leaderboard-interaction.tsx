import type { SlideElement } from "@Prezzy/shared";
import { mixHex } from "@Prezzy/shared/theme";
import { Trophy } from "lucide-react";
import { useLeaderboard } from "@/lib/api/interact";
import { useInteractSession } from "@/components/interact/session-context";

export function LeaderboardInteraction(_props: { element: SlideElement }) {
  const { theme: t, presentationId, participantName } = useInteractSession();
  const { data: entries } = useLeaderboard(presentationId);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: mixHex(t.accent, t.bg, 0.3) }}>
        <Trophy className="size-3.5" /> Leaderboard
      </p>

      {!entries || entries.length === 0 ? (
        <p className="text-sm" style={{ color: t.muted }}>
          No scores yet — answer quizzes to get on the board.
        </p>
      ) : (
        <div className="flex w-full flex-col gap-1.5">
          {entries.slice(0, 10).map((entry, i) => {
            const isMe = entry.name === participantName;
            return (
              <div
                key={`${entry.name}-${i}`}
                className="flex items-center gap-3 px-3.5 py-2.5"
                style={{
                  backgroundColor: isMe ? t.accent : t.surface,
                  color: isMe ? t.bg : t.text,
                  borderRadius: t.radius,
                }}
              >
                <span
                  className="w-7 shrink-0 text-sm font-extrabold tabular-nums"
                  style={i < 3 && !isMe ? { color: t.accent } : undefined}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {entry.name}
                  {isMe && <span className="ml-1.5 text-xs opacity-70">(you)</span>}
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums">{entry.score}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
