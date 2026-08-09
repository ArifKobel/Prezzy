import type { SlideElement } from "@Prezzy/shared";
import {
  AlignLeft, ChevronLeft, Cloud, Heading, HelpCircle, Image,
  QrCode, Square, Trash2, Trophy,
} from "lucide-react";
import { useState } from "react";
import { useEditorActions, useEditorCtxState } from "@/lib/editor/editor-context";
import {
  ElementTile, InteractiveCard, PropSlider, TabBtn,
} from "@/components/editor/editor-ui";
import { ImageProperties } from "@/components/editor/properties/image-properties";
import { PositionSection } from "@/components/editor/properties/position-section";
import { QuizProperties } from "@/components/editor/properties/quiz-properties";
import { ShapeProperties } from "@/components/editor/properties/shape-properties";
import { StyleSection } from "@/components/editor/properties/style-section";
import { WordCloudProperties } from "@/components/editor/properties/word-cloud-properties";

export function PropertiesPanel({
  selectedEl,
}: {
  selectedEl: SlideElement | undefined;
}) {
  const actions = useEditorActions();
  const { activeSlideId, hasInteractiveElement } = useEditorCtxState();
  const [activeTab, setActiveTab] = useState<"standard" | "interactive">("standard");

  if (selectedEl) {
    return (
      <>
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
          <button onClick={actions.deselect} className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground">
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="flex-1 font-sans text-xs font-semibold capitalize text-foreground">
            {{ heading: "Heading", text: "Text Box", image: "Image", shape: "Shape", quiz: "Quiz", wordcloud: "Word Cloud", leaderboard: "Leaderboard", qrcode: "QR Code" }[selectedEl.type] ?? selectedEl.type}
          </span>
          <button
            onClick={() => actions.deleteElement(selectedEl.id)}
            title="Delete (⌫)"
            className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
          <PositionSection el={selectedEl} />

          {selectedEl.type === "image" && (
            <ImageProperties el={selectedEl} />
          )}

          {selectedEl.type === "shape" && (
            <ShapeProperties el={selectedEl} />
          )}

          {(selectedEl.type === "heading" || selectedEl.type === "text") && (
            <PropSlider label="Opacity" value={selectedEl.props?.opacity ?? 100} min={0} max={100} onChange={(v) => actions.updateProps({ id: selectedEl.id, props: { opacity: v } })} onPreview={(v) => actions.previewProps({ id: selectedEl.id, props: { opacity: v } })} />
          )}

          {selectedEl.type === "quiz" && (
            <QuizProperties el={selectedEl} />
          )}

          {selectedEl.type === "wordcloud" && (
            <WordCloudProperties el={selectedEl} />
          )}

          {(selectedEl.type === "quiz" || selectedEl.type === "wordcloud" || selectedEl.type === "leaderboard" || selectedEl.type === "qrcode") && (
            <StyleSection el={selectedEl} />
          )}

        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex shrink-0 items-center px-4 pt-3">
        <TabBtn label="Standard" active={activeTab === "standard"} onClick={() => setActiveTab("standard")} className="flex-1" />
        <TabBtn label="Interactive" active={activeTab === "interactive"} onClick={() => setActiveTab("interactive")} className="flex-1" />
      </div>

      {activeTab === "standard" && (
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
          <section>
            <p className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Basic Elements</p>
            <div className="grid grid-cols-2 gap-2">
              <ElementTile icon={<Heading className="size-5" />} label="Heading" onClick={() => actions.addElement("heading")} disabled={!activeSlideId} />
              <ElementTile icon={<AlignLeft className="size-5" />} label="Text Box" onClick={() => actions.addElement("text")} disabled={!activeSlideId} />
              <ElementTile icon={<Image className="size-5" />} label="Image" onClick={() => actions.addElement("image")} disabled={!activeSlideId} />
              <ElementTile icon={<Square className="size-5" />} label="Shape" onClick={() => actions.addElement("shape")} disabled={!activeSlideId} />
            </div>
          </section>
        </div>
      )}

      {activeTab === "interactive" && (
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
          <section>
            <p className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Interactive Elements</p>
            <div className="flex flex-col gap-2">
              <InteractiveCard icon={<HelpCircle className="size-4" />} title="Quick Quiz" subtitle="Audience votes on options" onClick={() => actions.addElement("quiz")} disabled={!activeSlideId || hasInteractiveElement} />
              <InteractiveCard icon={<Cloud className="size-4" />} title="Word Cloud" subtitle="Live audience input" onClick={() => actions.addElement("wordcloud")} disabled={!activeSlideId || hasInteractiveElement} />
              <InteractiveCard icon={<Trophy className="size-4" />} title="Leaderboard" subtitle="Show top quiz scores" onClick={() => actions.addElement("leaderboard")} disabled={!activeSlideId || hasInteractiveElement} />
              <InteractiveCard icon={<QrCode className="size-4" />} title="QR Code" subtitle="Join link for audience" onClick={() => actions.addElement("qrcode")} disabled={!activeSlideId || hasInteractiveElement} />
            </div>
          </section>
          <p className="font-sans text-[10px] leading-relaxed text-muted-foreground/60">
            {hasInteractiveElement
              ? "This slide already has an interactive element. Remove it first to add a different one."
              : "Add an interactive element to your slide. Audience members scan the QR code during presentation to participate."}
          </p>
        </div>
      )}

    </>
  );
}
