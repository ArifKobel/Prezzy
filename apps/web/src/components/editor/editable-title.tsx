import { useEffect, useRef, useState } from "react";

export function EditableTitle({ title, onRename }: { title: string; onRename: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setDraft(title); }, [title, editing]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    else setDraft(title);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(title); setEditing(false); }
          e.stopPropagation();
        }}
        className="w-full rounded-sm border border-ring bg-transparent px-1 py-0.5 font-display text-sm font-semibold text-foreground outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-fit max-w-full truncate rounded-sm px-1 py-0.5 text-left font-display text-sm font-semibold text-foreground transition-colors hover:bg-surface-container"
      title="Click to rename"
    >
      {title}
    </button>
  );
}
