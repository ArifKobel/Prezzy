import { X } from "lucide-react";

export function ImageUrlDialog({ value, onChange, onSubmit, onClose }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-[400px] rounded-xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-sans text-sm font-semibold text-foreground">Image URL</h3>
          <button onClick={onClose} className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="url" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
              if (e.key === "Escape") onClose();
            }}
            autoFocus
          />
          <button onClick={onSubmit} disabled={!value.trim()} className="rounded-md bg-primary px-4 py-2 font-sans text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40">
            Set
          </button>
        </div>
        <p className="mt-2 font-sans text-[11px] text-muted-foreground">Paste a direct URL to an image (JPG, PNG, GIF, WebP, SVG)</p>
      </div>
    </div>
  );
}
