import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { Check, FolderOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { NewDraftCard } from "@/components/dashboard/new-draft-card";
import { SelectableCard } from "@/components/presentations/selectable-card";
import {
  firstSlideElementsQueryOptions,
  presentationsQueryOptions,
  useCreatePresentation,
  usePresentations,
  useRemovePresentation,
} from "@/lib/api/presentations";
import { meQueryOptions } from "@/lib/api/auth";

export const Route = createFileRoute("/presentations")({
  component: PresentationsRoute,
  loader: async ({ context: { queryClient } }) => {
    try {
      const [, presentations] = await Promise.all([
        queryClient.ensureQueryData(meQueryOptions),
        queryClient.ensureQueryData(presentationsQueryOptions),
      ]);
      await Promise.all(
        presentations.map((p) => queryClient.ensureQueryData(firstSlideElementsQueryOptions(p.id))),
      );
    } catch {}
  },
});

function PresentationsRoute() {
  return (
    <AuthGuard
      authenticated={<PresentationsPage />}
      unauthenticated={<RedirectToHome />}
      loading={
        <div className="flex h-full items-center justify-center">
          <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      }
    />
  );
}

function RedirectToHome() {
  const navigate = useNavigate();
  navigate({ to: "/" });
  return null;
}

function PresentationsPage() {
  const { data: presentations } = usePresentations();
  const createPresentation = useCreatePresentation();
  const removePresentation = useRemovePresentation();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (presentations === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  async function handleCreateNew() {
    const created = await createPresentation({ title: "Untitled Presentation" });
    navigate({ to: "/editor/$presentationId", params: { presentationId: created.id } });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleDeleteSelected() {
    selected.forEach((id) => removePresentation({ id }));
    setSelected(new Set());
  }

  const count = presentations?.length ?? 0;
  const allSelected = count > 0 && selected.size === count;
  const someSelected = selected.size > 0;

  return (
    <DashboardShell activePage="presentations">
      <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground">
        Presentations<span className="text-primary">.</span>
      </h1>

      <div className="mt-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (!presentations) return;
              if (allSelected) setSelected(new Set());
              else setSelected(new Set(presentations.map((p) => p.id)));
            }}
            className={`flex size-[18px] items-center justify-center border-[1.5px] transition-all ${
              allSelected
                ? "border-primary bg-primary text-primary-foreground"
                : someSelected
                  ? "border-primary bg-primary/10"
                  : "border-outline-variant/40 hover:border-primary/60"
            }`}
          >
            {allSelected && <Check className="size-3" strokeWidth={2.5} />}
            {someSelected && !allSelected && <div className="h-[1.5px] w-2 rounded-full bg-primary" />}
          </button>
          <span className="font-sans text-[13px] text-muted-foreground">
            {someSelected ? (
              <><span className="font-medium text-foreground">{selected.size}</span> of {count} selected</>
            ) : (
              <>{count} presentation{count !== 1 ? "s" : ""}</>
            )}
          </span>

          {someSelected && (
            <div className="flex items-center gap-1">
              <div className="mr-1 h-4 w-px bg-outline-variant/20" />
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-lg px-2.5 py-1.5 font-sans text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Deselect
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 bg-primary px-4 py-2 font-sans text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-dim"
        >
          <Plus className="size-3.5" /> New Presentation
        </button>
      </div>

      {presentations?.length > 0 && (
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {presentations?.map((p) => (
          <SelectableCard
            key={p.id}
            presentation={p}
            isSelected={selected.has(p.id)}
            anySelected={someSelected}
            onToggle={() => toggleSelect(p.id)}
          />
        ))}
        <NewDraftCard onClick={handleCreateNew} />
        </div>
      )}

      {count === 0 && (
        <div className="mt-20 flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center bg-surface-container">
            <FolderOpen className="size-7 text-muted-foreground/30" />
          </div>
          <div className="text-center">
            <p className="font-display text-sm font-bold text-foreground">No presentations yet</p>
            <p className="mt-1 font-sans text-xs text-muted-foreground/60">Create your first one to get started</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="mt-2 flex items-center gap-1.5 bg-primary px-5 py-2 font-sans text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-dim"
          >
            <Plus className="size-3.5" /> Create Presentation
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
