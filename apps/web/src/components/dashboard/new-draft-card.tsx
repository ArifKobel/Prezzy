import { Plus } from "lucide-react";

export function NewDraftCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-full min-h-[13.5rem] flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-lowest transition-all hover:border-primary/30 hover:shadow-[0_12px_40px_rgb(35_31_28_/_0.06)]"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-surface-container transition-colors group-hover:bg-secondary-container">
        <Plus className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
      <span className="mt-3 font-sans text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        Start a new draft
      </span>
    </button>
  );
}
