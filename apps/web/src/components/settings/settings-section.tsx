export function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-display text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}
