import type { PresencePeer } from "@/lib/editor/use-presence";

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

export function PresenceAvatars({ peers }: { peers: PresencePeer[] }) {
  if (peers.length === 0) return null;
  return (
    <div className="flex items-center -space-x-1.5" title={peers.map((peer) => peer.name).join(", ")}>
      {peers.slice(0, 4).map((peer) => (
        <div
          key={peer.clientId}
          className="flex size-6 items-center justify-center rounded-full font-sans text-[9px] font-bold text-white ring-2 ring-surface"
          style={{ backgroundColor: peer.color }}
        >
          {initials(peer.name)}
        </div>
      ))}
      {peers.length > 4 && (
        <div className="flex size-6 items-center justify-center rounded-full bg-surface-container font-sans text-[9px] font-medium text-muted-foreground ring-2 ring-surface">
          +{peers.length - 4}
        </div>
      )}
    </div>
  );
}
