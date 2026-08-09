import type { SlideElement } from "@Prezzy/shared";
import type { PresencePeer } from "@/lib/editor/use-presence";

export function RemotePresence({
  peers,
  activeSlideId,
  elements,
}: {
  peers: PresencePeer[];
  activeSlideId: string | null;
  elements: SlideElement[];
}) {
  const visible = peers.filter((peer) => peer.slideId === activeSlideId);
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((peer) => (
        <div key={peer.clientId} className="pointer-events-none">
          {elements
            .filter((el) => peer.selection.includes(el.id))
            .map((el) => (
              <div
                key={el.id}
                className="pointer-events-none absolute z-30"
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width}%`,
                  height: `${el.height}%`,
                  outline: `2px solid ${peer.color}`,
                  outlineOffset: 2,
                  opacity: 0.6,
                  transform: el.props?.rotation ? `rotate(${el.props.rotation}deg)` : undefined,
                }}
              />
            ))}
          {peer.cursor && (
            <div
              className="pointer-events-none absolute z-50 transition-[left,top] duration-75"
              style={{ left: `${peer.cursor.x}%`, top: `${peer.cursor.y}%` }}
            >
              <svg width="14" height="18" viewBox="0 0 14 18">
                <path d="M0 0 L14 10.5 L7.5 11.5 L4.5 18 Z" fill={peer.color} />
              </svg>
              <span
                className="ml-3 whitespace-nowrap rounded px-1 py-0.5 font-sans text-[9px] font-medium text-white"
                style={{ backgroundColor: peer.color }}
              >
                {peer.name}
              </span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
