import type { SlideElement } from "@Prezzy/shared";
import type { EditorStore } from "@/lib/editor/store";

export interface SyncTransport {
  putSlideElements(slideId: string, elements: SlideElement[]): Promise<void>;
}

export type SyncStatus = "idle" | "saving" | "error";

export interface SyncOptions {
  debounceMs?: number;
  retryMs?: number;
  onStatus?: (status: SyncStatus) => void;
}

const fingerprint = (elements: SlideElement[]): string =>
  JSON.stringify(
    elements.map((el) => [el.id, el.x, el.y, el.width, el.height, el.zIndex, el.type, el.props]),
  );

function bySlide(elements: SlideElement[]): Map<string, SlideElement[]> {
  const map = new Map<string, SlideElement[]>();
  for (const el of elements) {
    const list = map.get(el.slideId);
    if (list) list.push(el);
    else map.set(el.slideId, [el]);
  }
  return map;
}

export function createSync(store: EditorStore, transport: SyncTransport, options: SyncOptions = {}) {
  const debounceMs = options.debounceMs ?? 400;
  const retryMs = options.retryMs ?? 1000;

  const synced = new Map<string, string>();
  const dirty = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let flushing = false;
  let status: SyncStatus = "idle";
  let stopped = false;

  function setStatus(next: SyncStatus) {
    if (status === next) return;
    status = next;
    options.onStatus?.(next);
  }

  function markBaseline() {
    synced.clear();
    for (const [slideId, elements] of bySlide(store.getState().elements)) {
      synced.set(slideId, fingerprint(elements));
    }
    dirty.clear();
  }

  function detect() {
    const groups = bySlide(store.getState().elements);
    for (const slideId of store.getState().slides.map((s) => s.id)) {
      const elements = groups.get(slideId) ?? [];
      if (synced.get(slideId) !== fingerprint(elements)) dirty.add(slideId);
    }
    for (const slideId of [...synced.keys()]) {
      if (!groups.has(slideId) && !store.getState().slides.some((s) => s.id === slideId)) {
        synced.delete(slideId);
        dirty.delete(slideId);
      }
    }
  }

  function schedule(delay: number) {
    if (stopped || timer !== null) return;
    timer = setTimeout(() => { timer = null; void flush(); }, delay);
  }

  async function flush(): Promise<void> {
    if (stopped || flushing) return;
    if (dirty.size === 0) { setStatus("idle"); return; }

    flushing = true;
    setStatus("saving");
    let failed = false;

    for (const slideId of [...dirty]) {
      const groups = bySlide(store.getState().elements);
      const elements = groups.get(slideId) ?? [];
      const sent = fingerprint(elements);
      try {
        await transport.putSlideElements(slideId, elements);
        if (fingerprint(bySlide(store.getState().elements).get(slideId) ?? []) === sent) {
          dirty.delete(slideId);
          synced.set(slideId, sent);
        }
      } catch {
        failed = true;
      }
    }

    flushing = false;
    if (stopped) return;

    if (dirty.size > 0) {
      setStatus(failed ? "error" : "saving");
      schedule(failed ? retryMs : debounceMs);
      return;
    }
    setStatus("idle");
  }

  markBaseline();

  const unsubscribe = store.subscribe(() => {
    if (stopped) return;
    detect();
    if (dirty.size > 0) schedule(debounceMs);
  });

  return {
    status: () => status,
    pending: () => new Set(dirty),
    reset: markBaseline,
    baselineSlide(slideId: string) {
      const elements = bySlide(store.getState().elements).get(slideId) ?? [];
      synced.set(slideId, fingerprint(elements));
      dirty.delete(slideId);
      if (dirty.size === 0) setStatus("idle");
    },
    flushNow: () => flush(),
    stop() {
      stopped = true;
      if (timer !== null) clearTimeout(timer);
      timer = null;
      unsubscribe();
    },
  };
}
