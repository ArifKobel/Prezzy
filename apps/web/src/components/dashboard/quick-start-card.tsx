export function QuickStartCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-surface-container-lowest px-4 py-3.5 text-left shadow-[0_4px_16px_rgba(47,51,51,0.04)] transition-all hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(47,51,51,0.08)]"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">{icon}</div>
      <div>
        <p className="font-sans text-sm font-semibold text-foreground">{title}</p>
        <p className="font-sans text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}
