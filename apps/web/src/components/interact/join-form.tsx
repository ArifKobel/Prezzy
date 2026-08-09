import type { ResolvedSlideTheme } from "@Prezzy/shared";
import { contrastOn } from "@/lib/quiz-constants";

export function JoinForm({
  theme: t,
  name,
  setName,
  onJoin,
}: {
  theme: ResolvedSlideTheme;
  name: string;
  setName: (name: string) => void;
  onJoin: () => void;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-extrabold" style={{ fontFamily: t.fontHeading, color: t.heading }}>
          What's your name?
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: t.muted }}>
          Enter your name to participate
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onJoin();
        }}
        className="flex w-full flex-col gap-3"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={30}
          autoFocus
          className="w-full px-4 py-3.5 text-center text-base outline-none"
          style={{
            backgroundColor: t.surface,
            color: t.text,
            borderRadius: t.radius,
            border: `1px solid ${t.muted}40`,
          }}
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-3.5 text-sm font-bold transition-opacity disabled:opacity-40"
          style={{ backgroundColor: t.accent, color: contrastOn(t.accent), borderRadius: t.radius }}
        >
          Join
        </button>
      </form>
    </div>
  );
}
