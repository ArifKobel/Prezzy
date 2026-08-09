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
    <div className="flex w-full flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          What's your name<span className="text-primary">?</span>
        </h2>
        <p className="mt-1.5 font-sans text-sm text-muted-foreground">
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
          className="w-full border border-border bg-card px-4 py-3.5 text-center font-sans text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full bg-primary py-3.5 font-sans text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dim active:scale-[0.99] disabled:opacity-40"
        >
          Join
        </button>
      </form>
    </div>
  );
}
