export function Shell({
  children,
  title,
  name,
  onChangeName,
}: {
  children: React.ReactNode;
  title?: string;
  name?: string;
  onChangeName?: () => void;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="shrink-0 font-display text-sm font-extrabold tracking-tight">
          Prezzy<span className="text-primary">.</span>
        </span>
        <div className="flex min-w-0 items-center gap-2">
          {title && (
            <span className="truncate font-sans text-xs text-muted-foreground">{title}</span>
          )}
          {name && (
            <button
              onClick={onChangeName}
              title="Change name"
              className="shrink-0 bg-secondary-container px-2.5 py-1 font-sans text-[11px] font-bold text-foreground transition-colors hover:bg-surface-container-high"
            >
              {name}
            </button>
          )}
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col items-center px-4 py-4">
        <div className="flex w-full max-w-sm flex-1 flex-col gap-4 [&>:only-child]:my-auto">{children}</div>
      </main>
    </div>
  );
}
