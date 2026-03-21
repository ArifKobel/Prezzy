import type { Id } from "@Prezzy/backend/convex/_generated/dataModel";
import { DESIGN_W, DESIGN_H } from "@/components/slide-canvas";
import Moveable from "react-moveable";
import { useEffect, useRef } from "react";
import type { Geo } from "@/lib/editor/snap";

export function ElementMoveable({
  targetNode,
  container,
  elementId,
  effectiveScale,
  geo,
  dragPosition,
  rotation,
  onInteractionStart,
  onInteractionEnd,
  onGeometryChange,
  onGeometryCommit,
  onRotationChange,
  onRotationCommit,
}: {
  targetNode: HTMLElement;
  container: HTMLElement | null;
  elementId: Id<"slideElements">;
  effectiveScale: number;
  geo: Geo;
  dragPosition?: { x: number; y: number };
  rotation: number;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
  onGeometryChange: (id: Id<"slideElements">, geo: Geo) => void;
  onGeometryCommit: (id: Id<"slideElements">, geo: Geo) => void;
  onRotationChange: (id: Id<"slideElements">, rotation: number) => void;
  onRotationCommit: (id: Id<"slideElements">, rotation: number) => void;
}) {
  const moveableRef = useRef<Moveable>(null);
  const interacting = useRef(false);
  const startGeo = useRef<Geo | null>(null);
  const latestGeo = useRef<Geo | null>(null);
  const latestRotation = useRef<number | null>(null);

  useEffect(() => {
    if (!interacting.current) {
      requestAnimationFrame(() => {
        if (!interacting.current) moveableRef.current?.updateRect();
      });
    }
  }, [geo.x, geo.y, geo.width, geo.height, rotation, effectiveScale, targetNode, dragPosition?.x, dragPosition?.y]);

  return (
    <Moveable
      ref={moveableRef}
      className="prezzy-moveable"
      target={targetNode}
      container={container}
      resizable
      rotatable
      draggable={false}
      origin={false}
      keepRatio={false}
      edge={false}
      throttleRotate={0}
      throttleResize={0}
      zoom={1 / effectiveScale}
      rotationPosition="top"
      renderDirections={["nw", "n", "ne", "e", "se", "s", "sw", "w"]}

      onResizeStart={() => {
        interacting.current = true;
        onInteractionStart();
        startGeo.current = { ...geo };
      }}
      onResize={({ target, width, height, drag }) => {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
        target.style.transform = drag.transform;

        const sg = startGeo.current!;
        latestGeo.current = {
          x: sg.x + (drag.beforeTranslate[0] / DESIGN_W) * 100,
          y: sg.y + (drag.beforeTranslate[1] / DESIGN_H) * 100,
          width: (width / DESIGN_W) * 100,
          height: (height / DESIGN_H) * 100,
        };
      }}
      onResizeEnd={() => {
        interacting.current = false;
        const g = latestGeo.current;
        if (g) {
          targetNode.style.left = `${g.x}%`;
          targetNode.style.top = `${g.y}%`;
          targetNode.style.width = `${g.width}%`;
          targetNode.style.height = `${g.height}%`;
          targetNode.style.transform = rotation ? `rotate(${rotation}deg)` : "";

          onGeometryChange(elementId, g);
          onGeometryCommit(elementId, g);
        }
        startGeo.current = null;
        latestGeo.current = null;
        onInteractionEnd();
        requestAnimationFrame(() => moveableRef.current?.updateRect());
      }}

      onRotateStart={() => {
        interacting.current = true;
        onInteractionStart();
      }}
      onRotate={({ target, rotation: rot }) => {
        let normalized = ((rot % 360) + 360) % 360;
        if (normalized < 5 || normalized > 355) normalized = 0;
        target.style.transform = normalized ? `rotate(${normalized}deg)` : "";
        latestRotation.current = normalized;
      }}
      onRotateEnd={() => {
        interacting.current = false;
        const r = latestRotation.current;
        if (r != null) {
          targetNode.style.transform = r ? `rotate(${r}deg)` : "";
          onRotationChange(elementId, r);
          onRotationCommit(elementId, r);
          latestRotation.current = null;
        }
        onInteractionEnd();
        requestAnimationFrame(() => moveableRef.current?.updateRect());
      }}
    />
  );
}
