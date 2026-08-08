export function Shell({
  children,
  title,
  name,
}: {
  children: React.ReactNode;
  title?: string;
  name?: string;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="" className="size-5" />
          <span className="font-display text-sm font-bold text-foreground">
            Prezzy
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {name && (
            <span className="rounded-full bg-primary/10 px-3 py-1 font-sans text-xs font-medium text-primary">
              {name}
            </span>
          )}
          {title && (
            <span className="max-w-[40%] truncate font-sans text-xs text-muted-foreground">
              {title}
            </span>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-8">
        {children}
      </main>
    </div>
  );
}
