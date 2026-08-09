export function SessionNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-display text-xl font-extrabold tracking-tight text-foreground">
        Session not found<span className="text-primary">.</span>
      </p>
      <p className="font-sans text-sm text-muted-foreground">
        Check the code and try again.
      </p>
      <a
        href="/interact"
        className="mt-1 bg-primary px-6 py-2.5 font-sans text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dim"
      >
        Try another code
      </a>
    </div>
  );
}
