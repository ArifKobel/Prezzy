export function LiveDot() {
  return (
    <div className="flex items-center gap-1.5 text-primary">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        <span className="inline-flex size-2 rounded-full bg-current" />
      </span>
      <span className="font-sans text-[11px] font-bold uppercase tracking-wider">Live</span>
    </div>
  );
}
