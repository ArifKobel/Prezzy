import { cn } from "@Prezzy/ui/lib/utils";

export function FmtBtn({ active, onClick, children, title }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title?: string;
}) {
  return (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-xs transition-all",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-surface-container hover:text-foreground",
      )}
    >{children}</button>
  );
}
