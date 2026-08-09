export function LiveDot({ color }: { color: string }) {
  return (
    <div className="mt-1 flex items-center gap-2" style={{ color }}>
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        <span className="inline-flex size-2 rounded-full bg-current" />
      </span>
      <span className="text-xs font-semibold">Live</span>
    </div>
  );
}
