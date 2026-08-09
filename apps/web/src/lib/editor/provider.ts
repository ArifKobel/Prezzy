import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import type { Socket } from "socket.io-client";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import type * as Y from "yjs";
import { REMOTE_ORIGIN } from "@/lib/editor/doc";

export type ProviderStatus = "connecting" | "synced" | "offline" | "denied";

interface SyncMessage {
  presentationId: string;
  data: Uint8Array | ArrayBuffer;
}

const toBytes = (data: SyncMessage["data"]): Uint8Array =>
  data instanceof Uint8Array ? data : new Uint8Array(data);

export function createDocProvider(
  doc: Y.Doc,
  presentationId: string,
  socket: Socket,
  options: {
    awareness: awarenessProtocol.Awareness;
    onStatus: (status: ProviderStatus) => void;
  },
) {
  const { awareness, onStatus } = options;
  let destroyed = false;
  let status: ProviderStatus = "connecting";

  const setStatus = (next: ProviderStatus) => {
    if (destroyed || status === next) return;
    status = next;
    onStatus(next);
  };

  const send = (data: Uint8Array) => {
    socket.emit("doc:sync", { presentationId, data });
  };

  const sendAwareness = (clientIds: number[]) => {
    socket.emit("doc:awareness", {
      presentationId,
      data: awarenessProtocol.encodeAwarenessUpdate(awareness, clientIds),
    });
  };

  const join = () => {
    if (destroyed) return;
    setStatus("connecting");
    socket.emit("doc:join", presentationId, (ack: { ok: boolean } | undefined) => {
      if (destroyed) return;
      if (!ack?.ok) {
        setStatus("denied");
        return;
      }
      const encoder = encoding.createEncoder();
      syncProtocol.writeSyncStep1(encoder, doc);
      send(encoding.toUint8Array(encoder));
      if (awareness.getLocalState() !== null) sendAwareness([doc.clientID]);
    });
  };

  const onSync = (message: SyncMessage | undefined) => {
    if (destroyed || message?.presentationId !== presentationId || !message.data) return;
    const decoder = decoding.createDecoder(toBytes(message.data));
    const encoder = encoding.createEncoder();
    const messageType = syncProtocol.readSyncMessage(decoder, encoder, doc, REMOTE_ORIGIN);
    if (encoding.length(encoder) > 0) send(encoding.toUint8Array(encoder));
    if (messageType === syncProtocol.messageYjsSyncStep2) setStatus("synced");
  };

  const onAwareness = (message: SyncMessage | undefined) => {
    if (destroyed || message?.presentationId !== presentationId || !message.data) return;
    awarenessProtocol.applyAwarenessUpdate(awareness, toBytes(message.data), REMOTE_ORIGIN);
  };

  const onAwarenessUpdate = (
    changes: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => {
    if (destroyed || origin === REMOTE_ORIGIN || status === "denied") return;
    const changed = [...changes.added, ...changes.updated, ...changes.removed];
    if (changed.length > 0) sendAwareness(changed);
  };

  const onUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === REMOTE_ORIGIN || status === "denied") return;
    const encoder = encoding.createEncoder();
    syncProtocol.writeUpdate(encoder, update);
    send(encoding.toUint8Array(encoder));
  };

  const onDisconnect = () => setStatus("offline");

  socket.on("connect", join);
  socket.on("disconnect", onDisconnect);
  socket.on("doc:sync", onSync);
  socket.on("doc:awareness", onAwareness);
  doc.on("update", onUpdate);
  awareness.on("update", onAwarenessUpdate);
  if (socket.connected) join();

  return {
    status: () => status,
    destroy() {
      awareness.setLocalState(null);
      destroyed = true;
      awareness.off("update", onAwarenessUpdate);
      doc.off("update", onUpdate);
      socket.off("connect", join);
      socket.off("disconnect", onDisconnect);
      socket.off("doc:sync", onSync);
      socket.off("doc:awareness", onAwareness);
      if (socket.connected) socket.emit("doc:leave", presentationId);
    },
  };
}
