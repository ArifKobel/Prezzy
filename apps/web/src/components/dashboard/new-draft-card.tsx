import { Plus } from "lucide-react";

export function NewDraftCard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex h-full flex-col gap-3 text-left">
      <div className="flex aspect-video w-full items-center justify-center gap-2 border-2 border-dashed border-border transition-colors group-hover:border-primary/50">
        <Plus className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
        <span className="font-sans text-xs font-bold text-muted-foreground transition-colors group-hover:text-foreground">
          New presentation
        </span>
      </div>
    </button>
  );
}
