export function QuizLobby({
  question,
  participantCount,
  bg,
  text,
  textMuted,
  textSub,
  textFaint,
  surfaceMuted,
  dotColor,
}: {
  question: string;
  participantCount?: number;
  bg: string;
  text: string;
  textMuted: string;
  textSub: string;
  textFaint: string;
  surfaceMuted: string;
  dotColor: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center" style={{ backgroundColor: bg }}>
      <p className="mb-[3%] font-sans text-[0.32em] font-medium uppercase tracking-[0.12em]" style={{ color: textMuted }}>
        Quiz
      </p>

      <h2 className="mb-[6%] max-w-[70%] text-center font-display text-[1.6em] font-bold leading-[1.15] tracking-tight" style={{ color: text }} dangerouslySetInnerHTML={{ __html: question }} />

      <div className="flex items-center gap-[6px] rounded-full px-[14px] py-[6px]" style={{ backgroundColor: surfaceMuted }}>
        <span className="relative flex size-[6px]">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: dotColor }} />
          <span className="inline-flex size-[6px] rounded-full" style={{ backgroundColor: dotColor }} />
        </span>
        <span className="font-sans text-[11px] font-medium" style={{ color: textSub }}>
          {(participantCount ?? 0) === 0
            ? "Waiting for players…"
            : `${participantCount} player${participantCount !== 1 ? "s" : ""} connected`}
        </span>
      </div>

      <p className="mt-[6%] font-sans text-[0.26em] tracking-wide" style={{ color: textFaint }}>
        Navigate forward to begin
      </p>
    </div>
  );
}
