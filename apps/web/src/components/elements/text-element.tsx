import type { ElementProps } from "@Prezzy/shared";
import { cn } from "@Prezzy/ui/lib/utils";
import { HEADING_CLS, TEXT_CLS } from "@/components/slide-canvas";
import { themeColorVar } from "@/lib/theme-tokens";

export function TextElement({
  isHeading,
  content,
  props,
  showPlaceholder = false,
}: {
  isHeading: boolean;
  content: string;
  props?: ElementProps | null;
  showPlaceholder?: boolean;
}) {
  return (
    <div
      className={cn("pointer-events-none select-none", isHeading ? HEADING_CLS : TEXT_CLS)}
      style={
        {
          opacity: props?.opacity != null ? props.opacity / 100 : 1,
          "--element-font-size": props?.fontSize != null ? `${props.fontSize}px` : undefined,
          fontWeight: props?.bold ? 700 : undefined,
          textAlign: props?.align,
          color: themeColorVar(props?.textColor),
        } as React.CSSProperties
      }
      dangerouslySetInnerHTML={{
        __html:
          content ||
          (showPlaceholder
            ? `<p style="color: var(--slide-muted); opacity: 0.5">${isHeading ? "Heading" : "Text box"}</p>`
            : ""),
      }}
    />
  );
}
