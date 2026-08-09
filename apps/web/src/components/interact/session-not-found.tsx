export function SessionNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-display text-lg font-bold text-foreground">
        Session not found
      </p>
      <p className="font-sans text-sm text-muted-foreground">
        Check the code and try again.
      </p>
      <a
        href="/interact"
        className="mt-1 rounded-xl bg-primary hover:bg-primary-dim px-6 py-2.5 font-sans text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
      >
        Try another code
      </a>
    </div>
  );
}
