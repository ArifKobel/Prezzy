import { Image } from "lucide-react";

export function ImageElement({
  src,
  objectFit,
  borderRadius,
  opacity,
  children,
}: {
  src?: string;
  objectFit?: string;
  borderRadius?: number;
  opacity?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        borderRadius: borderRadius != null ? `${borderRadius}px` : "var(--slide-radius)",
        opacity: opacity != null ? opacity / 100 : 1,
        ...(src
          ? {}
          : {
              backgroundColor: "var(--slide-surface)",
              border: "1px dashed color-mix(in srgb, var(--slide-muted) 50%, transparent)",
            }),
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full"
          style={{ objectFit: (objectFit as React.CSSProperties["objectFit"]) ?? "cover" }}
        />
      ) : children ? (
        children
      ) : (
        <Image className="size-6 opacity-50 [color:var(--slide-muted)]" />
      )}
    </div>
  );
}
