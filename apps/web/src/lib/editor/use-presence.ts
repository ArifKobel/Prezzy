import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";

export interface PresencePeer {
  clientId: number;
  name: string;
  color: string;
  slideId: string | null;
  cursor: { x: number; y: number } | null;
  selection: string[];
}

const PEER_COLORS = [
  "#c8401f",
  "#22574a",
  "#7c3aed",
  "#0e7490",
  "#b45309",
  "#be185d",
  "#4d7c0f",
  "#1d4ed8",
];

export const peerColor = (clientId: number): string =>
  PEER_COLORS[clientId % PEER_COLORS.length];

export function useRemotePresence(awareness: Awareness): PresencePeer[] {
  const [peers, setPeers] = useState<PresencePeer[]>([]);

  useEffect(() => {
    const read = () => {
      const next: PresencePeer[] = [];
      for (const [clientId, state] of awareness.getStates()) {
        if (clientId === awareness.clientID || !state) continue;
        const user = state.user as { name?: string } | undefined;
        next.push({
          clientId,
          name: user?.name ?? "Guest",
          color: peerColor(clientId),
          slideId: (state.slideId as string | null) ?? null,
          cursor: (state.cursor as { x: number; y: number } | null) ?? null,
          selection: Array.isArray(state.selection) ? (state.selection as string[]) : [],
        });
      }
      next.sort((a, b) => a.clientId - b.clientId);
      setPeers(next);
    };
    read();
    awareness.on("change", read);
    return () => {
      awareness.off("change", read);
    };
  }, [awareness]);

  return peers;
}
