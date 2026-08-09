import { useEffect, useMemo, useState } from "react";
import { fetchSlideElements, putSlideElements } from "@/lib/api/elements";
import { usePresentation, usePresentationElements } from "@/lib/api/presentations";
import { useSlides } from "@/lib/api/slides";
import { getSocket } from "@/lib/api/socket";
import { createInteraction } from "@/lib/editor/interaction";
import { createEditorSession } from "@/lib/editor/session";
import { createEditorStore } from "@/lib/editor/store";
import type { SyncStatus } from "@/lib/editor/sync";

export function useEditorDoc(presentationId: string) {
  const { data: presentation } = usePresentation(presentationId);
  const { data: slides } = useSlides(presentationId);
  const { data: allElements } = usePresentationElements(presentationId);

  const [store] = useState(() => createEditorStore());
  const interaction = useMemo(() => createInteraction(store), [store]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [ready, setReady] = useState(false);

  const session = useMemo(
    () =>
      createEditorSession(
        store,
        {
          putSlideElements: async (slideId, elements) => {
            await putSlideElements(slideId, elements);
          },
          getSlideElements: fetchSlideElements,
        },
        { onStatus: setSyncStatus },
      ),
    [store],
  );

  useEffect(() => {
    if (ready || !presentation || !slides || !allElements) return;
    session.load({
      title: presentation.title,
      theme: presentation.theme ?? null,
      slides,
      elements: allElements,
    });
    setReady(true);
  }, [ready, presentation, slides, allElements, session]);

  useEffect(() => {
    if (!ready || !slides) return;
    session.syncSlides(slides);
  }, [ready, slides, session]);

  useEffect(() => {
    if (!ready) return;
    const socket = getSocket();
    const onElementsChanged = (payload: { slideId?: string } | undefined) => {
      if (payload?.slideId) session.refreshSlide(payload.slideId);
    };
    socket.on("elements.changed", onElementsChanged);
    return () => { socket.off("elements.changed", onElementsChanged); };
  }, [ready, session]);

  useEffect(() => {
    return () => {
      void session.dispose().finally(() => store.destroy());
    };
  }, [session, store]);

  return {
    store,
    interaction,
    ready,
    syncStatus,
    presentation,
    adoptSlide: session.adoptSlide,
  };
}
