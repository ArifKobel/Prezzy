import { shapeClipPath } from "@/components/slide-canvas";

export function ShapeElement({
  shapeType = "rectangle",
  color,
  borderRadius,
  opacity,
}: {
  shapeType?: string;
  color?: string;
  borderRadius?: number;
  opacity?: number;
}) {
  const clip = shapeClipPath(shapeType);
  const isPill = shapeType === "pill";

  return (
    <div
      className="h-full w-full"
      style={{
        backgroundColor: color ?? "var(--color-secondary-container)",
        borderRadius: isPill
          ? "9999px"
          : borderRadius != null
            ? `${borderRadius}px`
            : "8px",
        opacity: opacity != null ? opacity / 100 : 1,
        clipPath: clip,
      }}
    />
  );
}
