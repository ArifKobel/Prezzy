import { Trophy } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { deriveBarFills, type ElementStyle } from "@/lib/quiz-constants";
import type { LeaderboardEntry } from "@/components/slide-canvas";

const DEFAULT_PODIUM_FILLS = ["#eab308", "#94a3b8", "#b45309", "#6366f1", "#8b5cf6"];
const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardElement({
  leaderboard,
  showPlaceholder,
  style,
}: {
  leaderboard?: LeaderboardEntry[];
  showPlaceholder?: boolean;
  style?: ElementStyle;
}) {
  const podiumFills = style?.accentColor
    ? deriveBarFills(style.accentColor).slice(0, 5)
    : DEFAULT_PODIUM_FILLS;
  const entries = leaderboard ?? [];
  const placeholder: LeaderboardEntry[] = showPlaceholder
    ? [
        { name: "Alice", score: 4800, correct: 5, total: 5 },
        { name: "Bob", score: 3600, correct: 4, total: 5 },
        { name: "Charlie", score: 2700, correct: 3, total: 5 },
        { name: "Diana", score: 1400, correct: 2, total: 5 },
        { name: "Eve", score: 800, correct: 1, total: 5 },
      ]
    : [];
  const raw = entries.length > 0 ? entries : placeholder;
  const maxScore = Math.max(...raw.map((e) => e.score), 1);
  const data = raw.slice(0, 5).map((entry, i) => ({
    ...entry,
    rank: i,
    barValue: entry.score === 0 ? maxScore * 0.02 : entry.score,
    displayName: `${MEDALS[i] ?? `${i + 1}.`}  ${entry.name}`,
  }));

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden p-[4%]"
      style={{ backgroundColor: style?.backgroundColor, borderRadius: "var(--slide-radius)" }}
    >
      <div className="mb-[3%] flex items-center gap-[2%]">
        <Trophy className="size-[1.2em] text-yellow-500" />
        <p className="text-[1em] font-bold [font-family:var(--slide-font-heading)] [color:var(--slide-text)]">
          Leaderboard
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[0.6em] opacity-40 [color:var(--slide-muted)]">
            No quiz responses yet
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex items-start">
          <ResponsiveContainer width="100%" height={Math.min(data.length * 56, 280)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 60, bottom: 4, left: 8 }}
              barCategoryGap="18%"
            >
              <XAxis type="number" hide domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} />
              <YAxis
                type="category"
                dataKey="displayName"
                axisLine={false}
                tickLine={false}
                width={120}
                tick={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: "0.55em",
                  fill: "var(--slide-text)",
                }}
              />
              <Bar
                dataKey="barValue"
                radius={[0, 8, 8, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
                animationBegin={0}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={podiumFills[i % podiumFills.length]}
                    fillOpacity={entry.score === 0 ? 0.3 : i === 0 ? 1 : 0.85 - i * 0.1}
                    style={
                      i === 0
                        ? { filter: "drop-shadow(4px 0 12px rgba(234, 179, 8, 0.3))" }
                        : undefined
                    }
                  />
                ))}
                <LabelList
                  dataKey="score"
                  position="right"
                  fontFamily="var(--font-sans)"
                  fontWeight="700"
                  fontSize="0.5em"
                  fill="var(--slide-text)"
                  formatter={(v: unknown) => Number(v).toLocaleString()}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {showPlaceholder && entries.length === 0 && (
        <p className="mt-auto text-center text-[0.4em] opacity-30 [color:var(--slide-muted)]">
          Preview — live data during presentation
        </p>
      )}
    </div>
  );
}
