export function LiveDot() {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6b8e7b] opacity-60" />
        <span className="inline-flex size-2 rounded-full bg-[#6b8e7b]" />
      </span>
      <span className="font-sans text-xs font-medium text-[#6b8e7b]">Live</span>
    </div>
  );
}
