import type { PresentationTheme, Slide, SlideElement } from "@Prezzy/shared";
import { LOCAL_ORIGIN, slidesOf } from "@/lib/editor/doc";
import {
  applyServerElements,
  mergeServerSlides,
  upsertServerSlide,
} from "@/lib/editor/server-mirror";
import type { EditorStore } from "@/lib/editor/store";
import { type SyncOptions, type SyncTransport, createSync } from "@/lib/editor/sync";

export interface SessionTransport extends SyncTransport {
  getSlideElements(slideId: string): Promise<SlideElement[]>;
}

export interface SessionInput {
  title: string;
  theme: PresentationTheme | null;
  slides: Slide[];
  elements: SlideElement[];
}

export type EditorSession = ReturnType<typeof createEditorSession>;

export function createEditorSession(
  store: EditorStore,
  transport: SessionTransport,
  options: SyncOptions = {},
) {
  const sync = createSync(store, transport, options);

  let localVersion = 0;
  const onDocUpdate = (_update: Uint8Array, origin: unknown) => {
    if (origin === LOCAL_ORIGIN) localVersion += 1;
  };
  store.doc.on("update", onDocUpdate);

  const adopting = new Set<string>();
  const refreshing = new Set<string>();

  async function adoptSlide(slide: Slide): Promise<void> {
    if (slidesOf(store.doc).has(slide.id)) {
      upsertServerSlide(store.doc, slide);
      return;
    }
    if (adopting.has(slide.id)) return;
    adopting.add(slide.id);
    try {
      const elements = await transport.getSlideElements(slide.id);
      upsertServerSlide(store.doc, slide);
      applyServerElements(store.doc, slide.id, elements);
      sync.baselineSlide(slide.id);
    } finally {
      adopting.delete(slide.id);
    }
  }

  return {
    load(input: SessionInput) {
      store.load(input);
      sync.reset();
    },

    adoptSlide,

    syncSlides(slides: Slide[]) {
      mergeServerSlides(store.doc, slides);
      for (const slide of slides) {
        if (!slidesOf(store.doc).has(slide.id)) void adoptSlide(slide).catch(console.error);
      }
    },

    refreshSlide(slideId: string) {
      if (!slidesOf(store.doc).has(slideId)) return;
      if (sync.pending().has(slideId) || refreshing.has(slideId)) return;
      refreshing.add(slideId);
      const version = localVersion;
      transport
        .getSlideElements(slideId)
        .then((elements) => {
          if (version !== localVersion) return;
          if (sync.pending().has(slideId)) return;
          applyServerElements(store.doc, slideId, elements);
          sync.baselineSlide(slideId);
        })
        .catch(() => {})
        .finally(() => {
          refreshing.delete(slideId);
        });
    },

    status: sync.status,
    pending: sync.pending,
    flushNow: sync.flushNow,

    async dispose() {
      store.doc.off("update", onDocUpdate);
      try {
        await sync.flushNow();
      } finally {
        sync.stop();
      }
    },
  };
}
