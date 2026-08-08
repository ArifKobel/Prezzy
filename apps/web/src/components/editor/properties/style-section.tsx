import type { ElementProps, SlideElement } from "@Prezzy/shared";
import { Paintbrush } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SectionLabel } from "@/components/editor/editor-ui";
import { clearProps } from "@/lib/api/elements";
import { useEditorActions } from "@/lib/editor/editor-context";

const HEX = /^#[0-9a-fA-F]{6}$/;

function ColorField({
  label,
  value,
  fallback,
  onCommit,
}: {
  label: string;
  value: string;
  fallback: string;
  onCommit: (value: string | null) => void;
}) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const focused = useRef(false);

  useEffect(() => {
    if (timer.current !== undefined || focused.current) return;
    setDraft(value);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = (next: string) => {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      onCommit(next);
    }, 300);
  };

  const commitDraft = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const next = draft.trim();
    if (next === value) return;
    onCommit(next || null);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={HEX.test(draft) ? draft : fallback}
        onChange={(e) => pick(e.target.value)}
        className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
      />
      <div className="flex-1">
        <label className="font-sans text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">
          {label}
        </label>
        <input
          type="text"
          value={draft}
          placeholder={fallback}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            commitDraft();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring"
        />
      </div>
    </div>
  );
}

export function StyleSection({ el }: { el: SlideElement }) {
  const { updateProps } = useEditorActions();
  const accent = el.props?.accentColor ?? "";
  const bg = el.props?.backgroundColor ?? "";
  const text = el.props?.textColor ?? "";

  const commit = (props: ElementProps) => {
    updateProps({ id: el.id, props });
  };

  return (
    <section>
      <SectionLabel icon={<Paintbrush className="size-3" />} label="Design" />
      <div className="flex flex-col gap-2.5">
        <ColorField
          key={`accent:${el.id}`}
          label="Accent"
          value={accent}
          fallback="#4e6073"
          onCommit={(value) => commit(value ? { accentColor: value } : clearProps("accentColor"))}
        />
        <ColorField
          key={`background:${el.id}`}
          label="Background"
          value={bg}
          fallback="#faf9f8"
          onCommit={(value) =>
            commit(value ? { backgroundColor: value } : clearProps("backgroundColor"))
          }
        />
        <ColorField
          key={`text:${el.id}`}
          label="Text"
          value={text}
          fallback="#2f3333"
          onCommit={(value) => commit(value ? { textColor: value } : clearProps("textColor"))}
        />
        {(accent || bg || text) && (
          <button
            onClick={() =>
              commit(clearProps("accentColor", "backgroundColor", "textColor"))
            }
            className="self-start font-sans text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            Reset to defaults
          </button>
        )}
      </div>
    </section>
  );
}
