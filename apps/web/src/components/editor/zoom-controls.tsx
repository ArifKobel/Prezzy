export function ZoomControls({ zoom, setZoom, onReset }: {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onReset: () => void;
}) {
  return (
    <div className="absolute bottom-3 left-3 z-50 flex items-center gap-1 rounded-lg border border-border bg-card/90 px-2 py-1 shadow-sm backdrop-blur-sm">
      <button onClick={() => setZoom((z) => Math.max(0.1, z * 0.9))} className="flex size-5 items-center justify-center rounded text-muted-foreground transition-all hover:bg-surface-container hover:text-foreground">
        <span className="text-xs font-medium">−</span>
      </button>
      <button onClick={onReset} className="min-w-[40px] px-1 text-center font-sans text-[10px] tabular-nums text-muted-foreground transition-all hover:text-foreground" title="Reset zoom">
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={() => setZoom((z) => Math.min(5, z * 1.1))} className="flex size-5 items-center justify-center rounded text-muted-foreground transition-all hover:bg-surface-container hover:text-foreground">
        <span className="text-xs font-medium">+</span>
      </button>
    </div>
  );
}
