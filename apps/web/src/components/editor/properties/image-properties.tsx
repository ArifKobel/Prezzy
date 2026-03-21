import type { Doc } from "@Prezzy/backend/convex/_generated/dataModel";
import { cn } from "@Prezzy/ui/lib/utils";
import {
  Image, ImagePlus, Link, Maximize, RectangleHorizontal, RotateCw, Upload, X,
} from "lucide-react";
import { useEditorActions, useEditorCtxState } from "@/lib/editor/editor-context";
import { PropSlider, SectionLabel } from "@/components/editor/editor-ui";
import { MirrorSection } from "@/components/editor/properties/mirror-section";

export function ImageProperties({ el }: { el: Doc<"slideElements"> }) {
  const { updateProps, updateImageSrc, triggerImageUpload, showImageUrlDialog, handleImageUpload } = useEditorActions();
  const { uploadingImageId } = useEditorCtxState();

  return (
    <>
      <section>
        <SectionLabel icon={<Image className="size-3" />} label="Image Source" />
        {el.props?.src ? (
          <div className="space-y-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-container">
              <img src={el.props.src} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => triggerImageUpload(el._id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 font-sans text-[11px] font-medium text-foreground transition-all hover:bg-surface-container">
                <Upload className="size-3" /> Replace
              </button>
              <button onClick={() => showImageUrlDialog(el._id, el.props?.src ?? "")} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 font-sans text-[11px] font-medium text-foreground transition-all hover:bg-surface-container">
                <Link className="size-3" /> URL
              </button>
              <button onClick={() => updateImageSrc({ id: el._id, src: "" })} className="flex items-center justify-center rounded-md border border-border bg-surface px-2 py-1.5 text-destructive transition-all hover:bg-destructive/10">
                <X className="size-3" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface-container/50 px-4 py-6 transition-all hover:border-primary/30 hover:bg-surface-container"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) handleImageUpload(file, el._id); }}
          >
            {uploadingImageId === el._id ? (
              <>
                <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                <span className="font-sans text-[11px] text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <ImagePlus className="size-8 text-muted-foreground/40" />
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => triggerImageUpload(el._id)} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 font-sans text-[11px] font-medium text-primary-foreground transition-all hover:bg-primary/90">
                    <Upload className="size-3" /> Upload Image
                  </button>
                  <button onClick={() => showImageUrlDialog(el._id)} className="font-sans text-[11px] text-muted-foreground transition-all hover:text-foreground">
                    or paste a URL
                  </button>
                </div>
                <span className="font-sans text-[10px] text-muted-foreground/50">or drag & drop</span>
              </>
            )}
          </div>
        )}
      </section>

      <section>
        <SectionLabel icon={<Maximize className="size-3" />} label="Fit Mode" />
        <div className="grid grid-cols-3 gap-1">
          {(["cover", "contain", "fill"] as const).map((fit) => (
            <button
              key={fit}
              onClick={() => updateProps({ id: el._id, props: { objectFit: fit } })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2 font-sans text-[10px] font-medium capitalize transition-all",
                (el.props?.objectFit ?? "cover") === fit
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-surface-container text-muted-foreground hover:bg-surface-container-high hover:text-foreground",
              )}
            >
              {fit === "cover" && <div className="flex size-6 items-center justify-center rounded border border-current"><div className="size-5 rounded-sm bg-current opacity-20" /></div>}
              {fit === "contain" && <div className="flex size-6 items-center justify-center rounded border border-current"><div className="h-3 w-5 rounded-sm bg-current opacity-20" /></div>}
              {fit === "fill" && <div className="flex size-6 items-center justify-center rounded border border-current"><div className="h-6 w-6 rounded bg-current opacity-20" /></div>}
              {{ cover: "Cover", contain: "Contain", fill: "Stretch" }[fit]}
            </button>
          ))}
        </div>
      </section>

      <PropSlider label="Border Radius" icon={<RectangleHorizontal className="size-3" />} value={el.props?.borderRadius ?? 8} min={0} max={50} onChange={(v) => updateProps({ id: el._id, props: { borderRadius: v } })} />
      <PropSlider label="Opacity" icon={<span className="font-sans text-[9px] font-bold">%</span>} value={el.props?.opacity ?? 100} min={0} max={100} onChange={(v) => updateProps({ id: el._id, props: { opacity: v } })} />
      <PropSlider label="Rotation" icon={<RotateCw className="size-3" />} value={el.props?.rotation ?? 0} min={0} max={360} onChange={(v) => updateProps({ id: el._id, props: { rotation: v } })} />

      <MirrorSection el={el} />
    </>
  );
}
