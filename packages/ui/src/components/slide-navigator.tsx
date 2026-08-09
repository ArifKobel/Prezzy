import { cn } from "@Prezzy/ui/lib/utils";
import type * as React from "react";

function SlideNavigator({ className, children, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="slide-navigator"
      className={cn(
        "flex items-center gap-2 rounded-xl bg-background/80 px-4 py-2 backdrop-blur-xl shadow-[0_12px_40px_rgba(47,51,51,0.06)]",
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  );
}

function SlideNavigatorItem({
  className,
  active,
  children,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      data-slot="slide-navigator-item"
      data-active={active || undefined}
      className={cn(
        "relative flex h-16 w-24 shrink-0 cursor-pointer items-end overflow-hidden rounded-lg bg-surface-container p-2 text-xs transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        active && "ring-2 ring-primary",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { SlideNavigator, SlideNavigatorItem };
