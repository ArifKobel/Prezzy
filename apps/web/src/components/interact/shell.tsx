import type { ResolvedSlideTheme } from "@Prezzy/shared";
import { resolveSlideTheme } from "@Prezzy/shared/theme";
import { slideThemeStyle } from "@/components/slide-canvas";

export function Shell({
  children,
  theme,
  title,
  name,
  onChangeName,
}: {
  children: React.ReactNode;
  theme?: ResolvedSlideTheme;
  title?: string;
  name?: string;
  onChangeName?: () => void;
}) {
  const t = theme ?? resolveSlideTheme(null);

  return (
    <div className="flex min-h-svh flex-col" style={slideThemeStyle(t)}>
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <span className="shrink-0 font-display text-sm font-extrabold tracking-tight">
          Prezzy<span style={{ color: t.accent }}>.</span>
        </span>
        <div className="flex min-w-0 items-center gap-2.5">
          {title && (
            <span className="truncate text-xs" style={{ color: t.muted }}>
              {title}
            </span>
          )}
          {name && (
            <button
              onClick={onChangeName}
              title="Change name"
              className="shrink-0 px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: t.surface, borderRadius: t.radius }}
            >
              {name}
            </button>
          )}
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="flex w-full max-w-md flex-col items-center gap-5">{children}</div>
      </main>
    </div>
  );
}
