import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/api/socket";
import { createInteraction } from "@/lib/editor/interaction";
import { type ProviderStatus, createDocProvider } from "@/lib/editor/provider";
import { createEditorStore } from "@/lib/editor/store";

export function useEditorDoc(presentationId: string) {
  const [store] = useState(() => createEditorStore());
  const interaction = useMemo(() => createInteraction(store), [store]);
  const [status, setStatus] = useState<ProviderStatus>("connecting");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const provider = createDocProvider(store.doc, presentationId, getSocket(), (next) => {
      setStatus(next);
      if (next === "synced") setReady(true);
    });
    return () => {
      provider.destroy();
      store.destroy();
    };
  }, [store, presentationId]);

  return { store, interaction, ready, status };
}
