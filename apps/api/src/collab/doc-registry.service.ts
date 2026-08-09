import { createHash } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { and, asc, eq, inArray, notInArray, sql } from "drizzle-orm";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { presentationDocs, presentations, slideElements, slides } from "@/db/schema";
import { EventsService } from "@/events/events.service";
import { type DocContent, hydrateDoc, readDoc } from "@/collab/doc-schema";

const SAVE_DEBOUNCE_MS = 1000;

export type DocBroadcaster = (
  presentationId: string,
  update: Uint8Array,
  originSocketId: string | null,
) => void;

interface DocSnapshot {
  meta: string;
  slides: string;
  elementsBySlide: Map<string, string>;
}

interface DocEntry {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  awarenessBySocket: Map<string, Set<number>>;
  presentationId: string;
  joinCode: string | null;
  connections: Set<string>;
  saveTimer: NodeJS.Timeout | null;
  dirty: boolean;
  saving: Promise<void> | null;
  lastSnapshot: DocSnapshot;
}

const hashOf = (value: unknown): string =>
  createHash("sha1").update(JSON.stringify(value)).digest("base64");

const snapshotOf = (content: DocContent): DocSnapshot => {
  const groups = new Map<string, DocContent["elements"]>();
  for (const element of content.elements) {
    const list = groups.get(element.slideId);
    if (list) list.push(element);
    else groups.set(element.slideId, [element]);
  }
  return {
    meta: hashOf([content.title, content.theme]),
    slides: hashOf(content.slides),
    elementsBySlide: new Map([...groups].map(([slideId, list]) => [slideId, hashOf(list)])),
  };
};

@Injectable()
export class DocRegistryService {
  private readonly logger = new Logger(DocRegistryService.name);
  private readonly entries = new Map<string, Promise<DocEntry>>();
  private broadcaster: DocBroadcaster | null = null;
  private awarenessBroadcaster: DocBroadcaster | null = null;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly events: EventsService,
  ) {}

  setBroadcaster(broadcaster: DocBroadcaster): void {
    this.broadcaster = broadcaster;
  }

  setAwarenessBroadcaster(broadcaster: DocBroadcaster): void {
    this.awarenessBroadcaster = broadcaster;
  }

  async applyAwareness(presentationId: string, update: Uint8Array, socketId: string): Promise<void> {
    const entry = await this.entryFor(presentationId);
    if (!entry) return;
    awarenessProtocol.applyAwarenessUpdate(entry.awareness, update, socketId);
  }

  async encodeAwareness(presentationId: string): Promise<Uint8Array | null> {
    const entry = await this.entryFor(presentationId);
    if (!entry) return null;
    const clientIds = [...entry.awareness.getStates().keys()];
    if (clientIds.length === 0) return null;
    return awarenessProtocol.encodeAwarenessUpdate(entry.awareness, clientIds);
  }

  async awarenessStates(presentationId: string): Promise<Map<number, Record<string, unknown>> | null> {
    const entry = await this.entryFor(presentationId);
    return entry ? entry.awareness.getStates() : null;
  }

  async connect(presentationId: string, socketId: string): Promise<Y.Doc> {
    let pending = this.entries.get(presentationId);
    if (!pending) {
      pending = this.open(presentationId);
      this.entries.set(presentationId, pending);
    }
    let entry: DocEntry;
    try {
      entry = await pending;
    } catch (error) {
      this.entries.delete(presentationId);
      throw error;
    }
    entry.connections.add(socketId);
    return entry.doc;
  }

  async docFor(presentationId: string): Promise<Y.Doc | null> {
    const entry = await this.entryFor(presentationId);
    return entry ? entry.doc : null;
  }

  async disconnect(presentationId: string, socketId: string): Promise<void> {
    const entry = await this.entryFor(presentationId);
    if (!entry) return;
    const owned = entry.awarenessBySocket.get(socketId);
    if (owned && owned.size > 0) {
      awarenessProtocol.removeAwarenessStates(entry.awareness, [...owned], socketId);
    }
    entry.awarenessBySocket.delete(socketId);
    entry.connections.delete(socketId);
    if (entry.connections.size > 0) return;
    this.entries.delete(presentationId);
    if (entry.saveTimer) {
      clearTimeout(entry.saveTimer);
      entry.saveTimer = null;
    }
    await this.save(entry);
    entry.awareness.destroy();
    entry.doc.destroy();
  }

  private async entryFor(presentationId: string): Promise<DocEntry | null> {
    const pending = this.entries.get(presentationId);
    if (!pending) return null;
    return pending.catch(() => null);
  }

  private async open(presentationId: string): Promise<DocEntry> {
    const [presentation] = await this.db
      .select()
      .from(presentations)
      .where(eq(presentations.id, presentationId))
      .limit(1);
    if (!presentation) throw new Error("Presentation not found");

    const doc = new Y.Doc();
    const [stored] = await this.db
      .select()
      .from(presentationDocs)
      .where(eq(presentationDocs.presentationId, presentationId))
      .limit(1);

    if (stored) {
      Y.applyUpdate(doc, stored.state);
    } else {
      const slideRows = await this.db
        .select()
        .from(slides)
        .where(eq(slides.presentationId, presentationId))
        .orderBy(asc(slides.order), asc(slides.createdAt));
      const elementRows = await this.db
        .select({ element: slideElements })
        .from(slideElements)
        .innerJoin(slides, eq(slides.id, slideElements.slideId))
        .where(eq(slides.presentationId, presentationId))
        .orderBy(asc(slideElements.createdAt));
      hydrateDoc(doc, presentation, slideRows, elementRows.map((row) => row.element));
    }

    const awareness = new awarenessProtocol.Awareness(doc);
    awareness.setLocalState(null);

    const entry: DocEntry = {
      doc,
      awareness,
      awarenessBySocket: new Map(),
      presentationId,
      joinCode: presentation.joinCode,
      connections: new Set(),
      saveTimer: null,
      dirty: false,
      saving: null,
      lastSnapshot: snapshotOf(readDoc(doc)),
    };

    doc.on("update", (update: Uint8Array, origin: unknown) => {
      entry.dirty = true;
      this.scheduleSave(entry);
      this.broadcaster?.(presentationId, update, typeof origin === "string" ? origin : null);
    });

    awareness.on(
      "update",
      (changes: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
        const { added, updated, removed } = changes;
        if (typeof origin === "string") {
          let owned = entry.awarenessBySocket.get(origin);
          if (!owned) {
            owned = new Set();
            entry.awarenessBySocket.set(origin, owned);
          }
          for (const clientId of [...added, ...updated]) owned.add(clientId);
          for (const clientId of removed) owned.delete(clientId);
        }
        const changed = [...added, ...updated, ...removed];
        if (changed.length === 0) return;
        this.awarenessBroadcaster?.(
          presentationId,
          awarenessProtocol.encodeAwarenessUpdate(awareness, changed),
          typeof origin === "string" ? origin : null,
        );
      },
    );

    return entry;
  }

  private scheduleSave(entry: DocEntry): void {
    if (entry.saveTimer) return;
    entry.saveTimer = setTimeout(() => {
      entry.saveTimer = null;
      void this.save(entry);
    }, SAVE_DEBOUNCE_MS);
  }

  private async save(entry: DocEntry): Promise<void> {
    while (entry.saving) await entry.saving;
    if (!entry.dirty) return;
    entry.dirty = false;
    entry.saving = (async () => {
      try {
        const content = readDoc(entry.doc);
        const state = Buffer.from(Y.encodeStateAsUpdate(entry.doc));
        await this.materialize(entry.presentationId, content, state);
        this.emitChanges(entry, content);
      } catch (error) {
        entry.dirty = true;
        this.scheduleSave(entry);
        this.logger.error(`Failed to persist doc ${entry.presentationId}`, error);
      }
    })();
    try {
      await entry.saving;
    } finally {
      entry.saving = null;
    }
  }

  private async materialize(presentationId: string, content: DocContent, state: Buffer): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(presentations)
        .set({ title: content.title, theme: content.theme, updatedAt: new Date() })
        .where(eq(presentations.id, presentationId));

      const slideIds = content.slides.map((slide) => slide.id);
      await tx
        .delete(slides)
        .where(
          slideIds.length > 0
            ? and(eq(slides.presentationId, presentationId), notInArray(slides.id, slideIds))
            : eq(slides.presentationId, presentationId),
        );
      if (content.slides.length > 0) {
        await tx
          .insert(slides)
          .values(content.slides.map((slide) => ({
            id: slide.id,
            presentationId,
            order: slide.order,
            title: slide.title,
            bg: slide.bg,
            createdAt: new Date(slide.createdAt),
          })))
          .onConflictDoUpdate({
            target: slides.id,
            set: {
              order: sql`excluded."order"`,
              title: sql`excluded."title"`,
              bg: sql`excluded."bg"`,
            },
          });

        const elementIds = content.elements.map((element) => element.id);
        await tx
          .delete(slideElements)
          .where(
            elementIds.length > 0
              ? and(inArray(slideElements.slideId, slideIds), notInArray(slideElements.id, elementIds))
              : inArray(slideElements.slideId, slideIds),
          );
        if (content.elements.length > 0) {
          await tx
            .insert(slideElements)
            .values(content.elements.map((element) => ({
              id: element.id,
              slideId: element.slideId,
              type: element.type,
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              zIndex: element.zIndex,
              props: element.props,
              createdAt: new Date(element.createdAt),
            })))
            .onConflictDoUpdate({
              target: slideElements.id,
              set: {
                slideId: sql`excluded."slide_id"`,
                type: sql`excluded."type"`,
                x: sql`excluded."x"`,
                y: sql`excluded."y"`,
                width: sql`excluded."width"`,
                height: sql`excluded."height"`,
                zIndex: sql`excluded."z_index"`,
                props: sql`excluded."props"`,
              },
            });
        }
      }

      await tx
        .insert(presentationDocs)
        .values({ presentationId, state })
        .onConflictDoUpdate({
          target: presentationDocs.presentationId,
          set: { state: sql`excluded."state"`, updatedAt: new Date() },
        });
    });
  }

  private emitChanges(entry: DocEntry, content: DocContent): void {
    const target = { presentationId: entry.presentationId, joinCode: entry.joinCode };
    const previous = entry.lastSnapshot;
    const current = snapshotOf(content);

    if (current.meta !== previous.meta) {
      this.events.presentationUpdated(target);
    }
    if (current.slides !== previous.slides) {
      this.events.slidesChanged(target);
    }

    const slideIds = new Set([...previous.elementsBySlide.keys(), ...current.elementsBySlide.keys()]);
    for (const slideId of slideIds) {
      if (previous.elementsBySlide.get(slideId) !== current.elementsBySlide.get(slideId)) {
        this.events.elementsChanged(target, slideId);
      }
    }

    entry.lastSnapshot = current;
  }
}
