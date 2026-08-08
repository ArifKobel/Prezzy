import { Trash2 } from "lucide-react";
import { useState } from "react";

import { useClearAllResponses } from "@/lib/api/interact";

export function ClearResponsesButton({ presentationId }: { presentationId: string }) {
  const clearAll = useClearAllResponses();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => { clearAll({ presentationId }); setConfirming(false); }}
          className="rounded bg-destructive px-2 py-0.5 font-sans text-[10px] font-medium text-white"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-0.5 font-sans text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 font-sans text-[10px] tracking-wide text-muted-foreground/60 transition-colors hover:text-destructive"
      title="Clear all audience responses"
    >
      <Trash2 className="size-3" />
      Clear responses
    </button>
  );
}
