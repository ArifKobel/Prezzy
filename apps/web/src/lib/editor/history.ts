import { useCallback, useRef, useState } from "react";

export interface HistoryEntry {
  undo: () => unknown;
  redo: () => unknown;
}

const MAX_HISTORY = 50;

export function useHistory() {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);
  const aliases   = useRef<Map<string, string>>(new Map());
  const queue     = useRef<Promise<void>>(Promise.resolve());
  const [, bump] = useState(0);

  const push = useCallback((entry: HistoryEntry) => {
    undoStack.current.push(entry);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    redoStack.current = [];
    bump((n) => n + 1);
  }, []);

  const liveId = useCallback((id: string) => {
    let current = id;
    const seen = new Set<string>([id]);
    while (true) {
      const next = aliases.current.get(current);
      if (!next || seen.has(next)) return current;
      seen.add(next);
      current = next;
    }
  }, []);

  const aliasId = useCallback((from: string, to: string) => {
    if (from !== to) aliases.current.set(from, to);
  }, []);

  const step = useCallback((
    from: React.RefObject<HistoryEntry[]>,
    to: React.RefObject<HistoryEntry[]>,
    apply: (entry: HistoryEntry) => unknown,
  ) => {
    const next = queue.current.then(async () => {
      const entry = from.current.pop();
      if (!entry) return;
      bump((n) => n + 1);
      try {
        await apply(entry);
        to.current.push(entry);
      } catch (error) {
        console.error("History step failed:", error);
        from.current.push(entry);
      } finally {
        bump((n) => n + 1);
      }
    });
    queue.current = next;
    return next;
  }, []);

  const undo = useCallback(() => step(undoStack, redoStack, (entry) => entry.undo()), [step]);
  const redo = useCallback(() => step(redoStack, undoStack, (entry) => entry.redo()), [step]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  return { push, undo, redo, canUndo, canRedo, liveId, aliasId };
}
