import { cn } from "@Prezzy/ui/lib/utils";
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
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden",
        !src && "bg-[#e8c9a8]",
      )}
      style={{
        borderRadius: borderRadius != null ? `${borderRadius}px` : "8px",
        opacity: opacity != null ? opacity / 100 : 1,
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
        <Image className="size-6 text-white/60" />
      )}
    </div>
  );
}
