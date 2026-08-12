import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-3 font-sans text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface">
      <nav className="flex items-center justify-between border-b border-border px-8 py-4">
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Prezzy<span className="text-primary">.</span>
        </Link>
      </nav>

      <main className="flex-1 px-8 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            {title}<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 font-sans text-sm text-muted-foreground">Last updated: {updated}</p>

          {children}

          <p className="mt-12 pb-4 text-center font-sans text-[11px] text-muted-foreground/50">
            © 2026 Prezzy. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
