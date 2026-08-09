import { env } from "@Prezzy/env/web";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.VITE_API_URL, { withCredentials: true });
  }
  return socket;
}

export function getSocketId(): string | null {
  return socket?.connected ? (socket.id ?? null) : null;
}

export function useRealtime(room: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!room) return;
    const s = getSocket();
    s.emit("join", room);

    const invalidate = (...keys: unknown[][]) => {
      for (const key of keys) queryClient.invalidateQueries({ queryKey: key });
    };
    const handlers: Record<string, (payload?: { slideId?: string; elementId?: string }) => void> = {
      "presentation.updated": () =>
        invalidate(["presentation"], ["presentations"], ["join"]),
      "slides.changed": () => invalidate(["slides"]),
      "elements.changed": (p) =>
        invalidate(["elements", p?.slideId], ["presentationElements"], ["firstSlideElements"]),
      "responses.changed": (p) => invalidate(["responses", p?.elementId], ["leaderboard"]),
      "presence.changed": () => invalidate(["participantCount"]),
    };
    for (const [event, handler] of Object.entries(handlers)) s.on(event, handler);

    return () => {
      s.emit("leave", room);
      for (const [event, handler] of Object.entries(handlers)) s.off(event, handler);
    };
  }, [room, queryClient]);
}
