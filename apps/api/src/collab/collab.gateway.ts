import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import type { Server, Socket } from "socket.io";
import * as syncProtocol from "y-protocols/sync";
import { AccessService } from "@/access/access.service";
import { SESSION_COOKIE } from "@/auth/auth.constants";
import { AuthService } from "@/auth/auth.service";
import { DocRegistryService } from "@/collab/doc-registry.service";
import { env } from "@/config/env";

interface SyncMessage {
  presentationId: string;
  data: Uint8Array | ArrayBuffer | Buffer;
}

const roomOf = (presentationId: string) => `doc:${presentationId}`;

const joinedDocs = (client: Socket): Set<string> => {
  if (!client.data.docs) client.data.docs = new Set<string>();
  return client.data.docs as Set<string>;
};

const toBytes = (data: SyncMessage["data"]): Uint8Array =>
  data instanceof Uint8Array ? data : new Uint8Array(data);

@WebSocketGateway({ cors: { origin: env.webOrigin, credentials: true } })
export class CollabGateway implements OnGatewayInit, OnGatewayDisconnect {
  private server!: Server;
  private readonly logger = new Logger(CollabGateway.name);

  constructor(
    private readonly auth: AuthService,
    private readonly access: AccessService,
    private readonly registry: DocRegistryService,
  ) {}

  afterInit(server: Server): void {
    this.server = server;
    this.registry.setBroadcaster((presentationId, update, originSocketId) => {
      const encoder = encoding.createEncoder();
      syncProtocol.writeUpdate(encoder, update);
      this.server
        .to(roomOf(presentationId))
        .except(originSocketId ?? [])
        .emit("doc:sync", { presentationId, data: encoding.toUint8Array(encoder) });
    });
    this.registry.setAwarenessBroadcaster((presentationId, update, originSocketId) => {
      this.server
        .to(roomOf(presentationId))
        .except(originSocketId ?? [])
        .emit("doc:awareness", { presentationId, data: update });
    });
  }

  @SubscribeMessage("doc:join")
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() presentationId: unknown,
  ): Promise<{ ok: boolean }> {
    if (typeof presentationId !== "string" || presentationId.length === 0) return { ok: false };
    const userId = this.userOf(client);
    if (!userId) return { ok: false };
    try {
      await this.access.ownedPresentation(presentationId, userId);
      const doc = await this.registry.connect(presentationId, client.id);
      await client.join(roomOf(presentationId));
      joinedDocs(client).add(presentationId);
      const encoder = encoding.createEncoder();
      syncProtocol.writeSyncStep1(encoder, doc);
      client.emit("doc:sync", { presentationId, data: encoding.toUint8Array(encoder) });
      const states = await this.registry.encodeAwareness(presentationId);
      if (states) client.emit("doc:awareness", { presentationId, data: states });
      return { ok: true };
    } catch (error) {
      this.logger.warn(`doc:join failed for ${presentationId}: ${error}`);
      return { ok: false };
    }
  }

  @SubscribeMessage("doc:awareness")
  async handleAwareness(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: SyncMessage | undefined,
  ): Promise<void> {
    const presentationId = message?.presentationId;
    if (typeof presentationId !== "string" || !message?.data) return;
    if (!client.rooms.has(roomOf(presentationId))) return;
    await this.registry.applyAwareness(presentationId, toBytes(message.data), client.id);
  }

  @SubscribeMessage("doc:sync")
  async handleSync(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: SyncMessage | undefined,
  ): Promise<void> {
    const presentationId = message?.presentationId;
    if (typeof presentationId !== "string" || !message?.data) return;
    if (!client.rooms.has(roomOf(presentationId))) return;
    const doc = await this.registry.docFor(presentationId);
    if (!doc) return;
    const decoder = decoding.createDecoder(toBytes(message.data));
    const encoder = encoding.createEncoder();
    syncProtocol.readSyncMessage(decoder, encoder, doc, client.id);
    if (encoding.length(encoder) > 0) {
      client.emit("doc:sync", { presentationId, data: encoding.toUint8Array(encoder) });
    }
  }

  @SubscribeMessage("doc:leave")
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() presentationId: unknown,
  ): Promise<void> {
    if (typeof presentationId !== "string") return;
    if (!joinedDocs(client).delete(presentationId)) return;
    await client.leave(roomOf(presentationId));
    await this.registry.disconnect(presentationId, client.id);
  }

  handleDisconnect(client: Socket): void {
    for (const presentationId of joinedDocs(client)) {
      void this.registry.disconnect(presentationId, client.id);
    }
  }

  private userOf(client: Socket): string | null {
    const header = client.handshake.headers.cookie;
    if (!header) return null;
    const cookie = header
      .split(/;\s*/)
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
    if (!cookie) return null;
    const token = decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1));
    return this.auth.verifyToken(token);
  }
}
