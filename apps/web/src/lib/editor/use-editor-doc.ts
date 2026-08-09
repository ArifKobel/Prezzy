import { useEffect, useMemo, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import { getSocket } from "@/lib/api/socket";
import { createInteraction } from "@/lib/editor/interaction";
import { type ProviderStatus, createDocProvider } from "@/lib/editor/provider";
import { createEditorStore } from "@/lib/editor/store";

export function useEditorDoc(presentationId: string) {
  const [store] = useState(() => createEditorStore());
  const interaction = useMemo(() => createInteraction(store), [store]);
  const awareness = useMemo(() => new Awareness(store.doc), [store]);
  const [status, setStatus] = useState<ProviderStatus>("connecting");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const provider = createDocProvider(store.doc, presentationId, getSocket(), {
      awareness,
      onStatus: (next) => {
        setStatus(next);
        if (next === "synced") setReady(true);
      },
    });
    return () => {
      provider.destroy();
      awareness.destroy();
      store.destroy();
    };
  }, [store, awareness, presentationId]);

  return { store, interaction, awareness, ready, status };
}
