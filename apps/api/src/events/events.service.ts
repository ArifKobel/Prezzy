import { Injectable } from "@nestjs/common";
import type { Server } from "socket.io";
import type { RealtimeTarget } from "@/events/realtime-target";
import { currentSocketId } from "@/events/socket-id-context";

@Injectable()
export class EventsService {
  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  presentationUpdated(target: RealtimeTarget): void {
    this.broadcast(target, "presentation.updated", {});
  }

  slidesChanged(target: RealtimeTarget): void {
    this.broadcast(target, "slides.changed", {});
  }

  elementsChanged(target: RealtimeTarget, slideId: string): void {
    this.broadcast(target, "elements.changed", { slideId });
  }

  responsesChanged(target: RealtimeTarget, elementId: string): void {
    this.broadcast(target, "responses.changed", { elementId });
  }

  presenceChanged(target: RealtimeTarget, count: number): void {
    this.broadcast(target, "presence.changed", { count });
  }

  private broadcast(target: RealtimeTarget, event: string, payload: Record<string, unknown>): void {
    if (!this.server) return;
    const emitter = this.server.except(currentSocketId() ?? []);
    emitter.to(`presentation:${target.presentationId}`).emit(event, payload);
    if (target.joinCode) {
      emitter.to(`join:${target.joinCode}`).emit(event, payload);
    }
  }
}
