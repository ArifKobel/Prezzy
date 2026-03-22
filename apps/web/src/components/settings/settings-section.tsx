export function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_4px_16px_rgba(47,51,51,0.04)]">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}
