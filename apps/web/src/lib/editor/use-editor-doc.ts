import type { Slide } from "@Prezzy/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSlideElements, putSlideElements } from "@/lib/api/elements";
import { usePresentation } from "@/lib/api/presentations";
import { usePresentationElements } from "@/lib/api/presentations";
import { useSlides } from "@/lib/api/slides";
import { getSocket } from "@/lib/api/socket";
import { slidesOf } from "@/lib/editor/doc";
import { createInteraction } from "@/lib/editor/interaction";
import {
  applyServerElements,
  mergeServerSlides,
  upsertServerSlide,
} from "@/lib/editor/server-mirror";
import { createEditorStore } from "@/lib/editor/store";
import { type SyncStatus, createSync } from "@/lib/editor/sync";

export function useEditorDoc(presentationId: string) {
  const { data: presentation } = usePresentation(presentationId);
  const { data: slides } = useSlides(presentationId);
  const { data: allElements } = usePresentationElements(presentationId);

  const [store] = useState(() => createEditorStore());
  const interaction = useMemo(() => createInteraction(store), [store]);
  const syncRef = useRef<ReturnType<typeof createSync> | null>(null);
  const adopting = useRef(new Set<string>());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || syncRef.current || !presentation || !slides || !allElements) return;
    store.load({
      title: presentation.title,
      theme: presentation.theme ?? null,
      slides,
      elements: allElements,
    });
    syncRef.current = createSync(
      store,
      { putSlideElements: async (slideId, elements) => { await putSlideElements(slideId, elements); } },
      { onStatus: setSyncStatus },
    );
    setReady(true);
  }, [ready, presentation, slides, allElements, store]);

  const adoptSlide = useCallback(async (slide: Slide) => {
    if (slidesOf(store.doc).has(slide.id)) {
      upsertServerSlide(store.doc, slide);
      return;
    }
    if (adopting.current.has(slide.id)) return;
    adopting.current.add(slide.id);
    try {
      const elements = await fetchSlideElements(slide.id);
      upsertServerSlide(store.doc, slide);
      applyServerElements(store.doc, slide.id, elements);
      syncRef.current?.baselineSlide(slide.id);
    } finally {
      adopting.current.delete(slide.id);
    }
  }, [store]);

  useEffect(() => {
    if (!ready || !slides) return;
    mergeServerSlides(store.doc, slides);
    for (const slide of slides) {
      if (!slidesOf(store.doc).has(slide.id)) void adoptSlide(slide).catch(console.error);
    }
  }, [ready, slides, store, adoptSlide]);

  useEffect(() => {
    if (!ready) return;
    const socket = getSocket();
    const onElementsChanged = (payload: { slideId?: string } | undefined) => {
      const slideId = payload?.slideId;
      if (!slideId || !slidesOf(store.doc).has(slideId)) return;
      if (syncRef.current?.pending().has(slideId)) return;
      fetchSlideElements(slideId)
        .then((elements) => {
          if (syncRef.current?.pending().has(slideId)) return;
          applyServerElements(store.doc, slideId, elements);
          syncRef.current?.baselineSlide(slideId);
        })
        .catch(console.error);
    };
    socket.on("elements.changed", onElementsChanged);
    return () => { socket.off("elements.changed", onElementsChanged); };
  }, [ready, store]);

  useEffect(() => {
    return () => {
      const sync = syncRef.current;
      if (sync) {
        void sync.flushNow().finally(() => {
          sync.stop();
          store.destroy();
        });
      } else {
        store.destroy();
      }
    };
  }, [store]);

  return { store, interaction, ready, syncStatus, presentation, adoptSlide };
}
