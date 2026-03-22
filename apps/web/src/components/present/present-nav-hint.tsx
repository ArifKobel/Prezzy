import { cn } from "@Prezzy/ui/lib/utils";
import { ChevronLeft } from "lucide-react";

export function PresentNavHint({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-opacity duration-300",
        visible ? "opacity-40" : "opacity-0",
      )}
    >
      <ChevronLeft className="size-8 text-white" />
    </div>
  );
}
