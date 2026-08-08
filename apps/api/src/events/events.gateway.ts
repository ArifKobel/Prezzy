import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { env } from "../config/env";
import { EventsService } from "./events.service";

@WebSocketGateway({ cors: { origin: env.webOrigin, credentials: true } })
export class EventsGateway implements OnGatewayInit {
  constructor(private readonly events: EventsService) {}

  afterInit(server: Server): void {
    this.events.setServer(server);
  }

  @SubscribeMessage("join")
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() room: unknown): void {
    if (typeof room !== "string" || room.length === 0) return;
    void client.join(room);
  }

  @SubscribeMessage("leave")
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() room: unknown): void {
    if (typeof room !== "string" || room.length === 0) return;
    void client.leave(room);
  }
}
