import { cn } from "@Prezzy/ui/lib/utils";
import * as React from "react";

function FocalPoint({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="focal-point"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-tertiary-container px-3 py-1 font-sans text-xs font-medium text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { FocalPoint };
