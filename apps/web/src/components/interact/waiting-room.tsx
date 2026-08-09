import { useInteractSession } from "@/components/interact/session-context";

export function WaitingRoom() {
  const { participantName } = useInteractSession();

  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Ready to go
      </p>
      <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
        You're in<span className="text-primary">.</span>
      </h2>
      <span className="bg-secondary-container px-3.5 py-1.5 font-sans text-sm font-bold text-foreground">
        {participantName}
      </span>
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-pulse rounded-full bg-primary"
              style={{ animationDelay: `${i * 300}ms` }}
            />
          ))}
        </div>
        <p className="font-sans text-sm text-muted-foreground">
          Waiting for the presenter to start
        </p>
      </div>
    </div>
  );
}
