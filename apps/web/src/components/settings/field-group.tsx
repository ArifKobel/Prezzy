export function FieldGroup({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-muted-foreground/50">{icon}</span>
        <label className="font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">{label}</label>
      </div>
      {children}
    </div>
  );
}
