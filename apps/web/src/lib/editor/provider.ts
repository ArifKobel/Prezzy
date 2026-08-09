import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import type { Socket } from "socket.io-client";
import * as syncProtocol from "y-protocols/sync";
import type * as Y from "yjs";
import { REMOTE_ORIGIN } from "@/lib/editor/doc";

export type ProviderStatus = "connecting" | "synced" | "offline" | "denied";

interface SyncMessage {
  presentationId: string;
  data: Uint8Array | ArrayBuffer;
}

export function createDocProvider(
  doc: Y.Doc,
  presentationId: string,
  socket: Socket,
  onStatus: (status: ProviderStatus) => void,
) {
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
    });
  };

  const onSync = (message: SyncMessage | undefined) => {
    if (destroyed || message?.presentationId !== presentationId || !message.data) return;
    const bytes = message.data instanceof Uint8Array ? message.data : new Uint8Array(message.data);
    const decoder = decoding.createDecoder(bytes);
    const encoder = encoding.createEncoder();
    const messageType = syncProtocol.readSyncMessage(decoder, encoder, doc, REMOTE_ORIGIN);
    if (encoding.length(encoder) > 0) send(encoding.toUint8Array(encoder));
    if (messageType === syncProtocol.messageYjsSyncStep2) setStatus("synced");
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
  doc.on("update", onUpdate);
  if (socket.connected) join();

  return {
    status: () => status,
    destroy() {
      destroyed = true;
      doc.off("update", onUpdate);
      socket.off("connect", join);
      socket.off("disconnect", onDisconnect);
      socket.off("doc:sync", onSync);
      if (socket.connected) socket.emit("doc:leave", presentationId);
    },
  };
}
