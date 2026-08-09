import { User } from "lucide-react";

export function JoinForm({
  name,
  setName,
  onJoin,
}: {
  name: string;
  setName: (name: string) => void;
  onJoin: () => void;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary-container">
        <User className="size-7 text-primary" />
      </div>
      <div className="text-center">
        <h2 className="font-display text-lg font-bold text-foreground">
          What's your name?
        </h2>
        <p className="mt-1.5 font-sans text-sm text-muted-foreground">
          Enter your name to participate
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            onJoin();
          }
        }}
        className="flex w-full flex-col gap-3"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={30}
          className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-center font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:shadow-[0_2px_16px_rgb(200_64_31_/_0.12)]"
          autoFocus
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-xl bg-primary hover:bg-primary-dim py-3.5 font-sans text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          Join
        </button>
      </form>
    </div>
  );
}
