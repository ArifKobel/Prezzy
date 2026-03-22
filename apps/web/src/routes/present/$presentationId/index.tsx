import { api } from "@Prezzy/backend/convex/_generated/api";
import type { Id } from "@Prezzy/backend/convex/_generated/dataModel";
import { SlideCanvas } from "@/components/slide-canvas";
import type { ElementResponses, LeaderboardEntry } from "@/components/slide-canvas";
import type { QuizPhase } from "@/components/live-quiz";
import { PresentControls } from "@/components/present/present-controls";
import { PresentEmptyState } from "@/components/present/present-empty-state";
import { PresentLoading } from "@/components/present/present-loading";
import { PresentNavHint } from "@/components/present/present-nav-hint";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/present/$presentationId/")({
  component: PresentPage,
  validateSearch: (search: Record<string, unknown>) => ({
    slide: (search.slide as string) || undefined,
  }),
});

const QUIZ_PHASES: QuizPhase[] = ["lobby", "question", "answering", "results"];

function PresentPage() {
  const { presentationId } = Route.useParams();
  const { slide: initialSlideId } = Route.useSearch();
  const pid = presentationId as Id<"presentations">;
  const navigate = useNavigate();

  const presentation = useQuery(api.presentations.get, { id: pid });
  const slides = useQuery(api.slides.listByPresentation, {
    presentationId: pid,
  });

  const setLiveSlide = useMutation(api.interactive.setLiveSlide);
  const clearLiveSlide = useMutation(api.interactive.clearLiveSlide);
  const ensureJoinCode = useMutation(api.interactive.ensureJoinCode);
  const setQuizPhase = useMutation(api.interactive.setQuizPhase);
  const clearQuiz = useMutation(api.interactive.clearQuiz);

  const [slideIndex, setSlideIndex] = useState(0);
  const initialSlideApplied = useRef(false);

  useEffect(() => {
    if (initialSlideApplied.current || !slides || !initialSlideId) return;
    const idx = slides.findIndex((s) => s._id === initialSlideId);
    if (idx >= 0) setSlideIndex(idx);
    initialSlideApplied.current = true;
  }, [slides, initialSlideId]);
  const [quizStep, setQuizStep] = useState<number | null>(null);
  const [answeringStartedAt, setAnsweringStartedAt] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navDirection = useRef<"forward" | "backward">("forward");
  const quizInitForSlide = useRef<string | null>(null);

  const totalSlides = slides?.length ?? 0;
  const currentSlide = slides?.[slideIndex] ?? null;

  const elements = useQuery(
    api.slideElements.listBySlide,
    currentSlide ? { slideId: currentSlide._id } : "skip",
  );

  const quizEl = elements?.find((el) => el.type === "quiz");

  const wordcloudEl = elements?.find((el) => el.type === "wordcloud");
  const wordcloudResponses = useQuery(
    api.interactive.listResponses,
    wordcloudEl?._id ? { elementId: wordcloudEl._id } : "skip",
  );

  const hasLeaderboard = elements?.some((el) => el.type === "leaderboard");
  const leaderboard = useQuery(
    api.interactive.getLeaderboard,
    hasLeaderboard ? { presentationId: pid } : "skip",
  );

  const participantCount = useQuery(
    api.interactive.getActiveParticipantCount,
    { presentationId: pid },
  );

  const responsesMap: ElementResponses | undefined =
    wordcloudEl && wordcloudResponses
      ? {
          [wordcloudEl._id]: wordcloudResponses.map((r) => ({
            value: r.value,
            participantId: r.participantId,
          })),
        }
      : undefined;

  useEffect(() => {
    if (!elements || !currentSlide) return;
    if (quizInitForSlide.current === currentSlide._id) return;

    quizInitForSlide.current = currentSlide._id;
    const hasQuiz = elements.some((el) => el.type === "quiz");
    if (hasQuiz) {
      setQuizStep(navDirection.current === "backward" ? 3 : 0);
    } else {
      setQuizStep(null);
    }
  }, [elements, currentSlide?._id]);

  useEffect(() => {
    if (!quizEl || quizStep === null) return;
    const elementId = quizEl._id as Id<"slideElements">;
    const phase = QUIZ_PHASES[quizStep];

    if (phase === "lobby") {
      clearQuiz({ presentationId: pid });
    } else {
      setQuizPhase({ presentationId: pid, elementId, phase });
      if (phase === "answering") {
        setAnsweringStartedAt(Date.now());
      }
    }
  }, [quizStep, quizEl?._id, pid, setQuizPhase, clearQuiz]);

  useEffect(() => {
    if (presentation && !joinCode) {
      if (presentation.joinCode) {
        setJoinCode(presentation.joinCode);
      } else {
        ensureJoinCode({ presentationId: pid }).then(setJoinCode);
      }
    }
  }, [presentation, joinCode, ensureJoinCode, pid]);

  useEffect(() => {
    if (currentSlide) {
      setLiveSlide({ presentationId: pid, slideId: currentSlide._id });
    }
  }, [currentSlide?._id, setLiveSlide, pid]);

  useEffect(() => {
    return () => {
      clearLiveSlide({ presentationId: pid });
    };
  }, [clearLiveSlide, pid]);

  const goNext = useCallback(() => {
    if (quizStep !== null && quizStep < 3) {
      setQuizStep((s) => (s ?? 0) + 1);
    } else {
      if (slideIndex >= totalSlides - 1) return;
      navDirection.current = "forward";
      quizInitForSlide.current = null;
      setQuizStep(null);
      setSlideIndex((i) => i + 1);
    }
  }, [quizStep, slideIndex, totalSlides]);

  const goPrev = useCallback(() => {
    if (quizStep !== null && quizStep > 0) {
      setQuizStep((s) => (s ?? 1) - 1);
    } else {
      if (slideIndex <= 0) return;
      navDirection.current = "backward";
      quizInitForSlide.current = null;
      setQuizStep(null);
      setSlideIndex((i) => i - 1);
    }
  }, [quizStep, slideIndex]);

  const onQuizQuestionEnd = useCallback(() => {
    setQuizStep(2);
  }, []);

  const onQuizTimerEnd = useCallback(() => {
    setQuizStep(3);
  }, []);

  const exitPresent = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate({ to: "/editor/$presentationId", params: { presentationId } });
  }, [navigate, presentationId]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          exitPresent();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, exitPresent, toggleFullscreen]);

  const showControlsBriefly = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  if (presentation === undefined || slides === undefined) {
    return <PresentLoading />;
  }

  if (presentation === null || totalSlides === 0) {
    return (
      <PresentEmptyState
        message={
          presentation === null
            ? "Presentation not found."
            : "No slides to present."
        }
        onExit={exitPresent}
      />
    );
  }

  const currentQuizPhase: QuizPhase | undefined =
    quizStep !== null ? QUIZ_PHASES[quizStep] : undefined;

  const isOnQuiz = quizStep !== null;
  const quizStepLabel = isOnQuiz
    ? ["Lobby", "Question", "Answering", "Results"][quizStep!]
    : null;

  const isFirst = slideIndex === 0 && (quizStep === null || quizStep === 0);
  const isLast =
    slideIndex === totalSlides - 1 && (quizStep === null || quizStep === 3);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      onMouseMove={showControlsBriefly}
    >
      <SlideCanvas
        elements={elements ?? []}
        scaleToFit
        className="h-full w-full"
        responses={responsesMap}
        leaderboard={leaderboard as LeaderboardEntry[] | undefined}
        presentationId={pid}
        quizPhase={currentQuizPhase}
        quizStartedAt={answeringStartedAt}
        onQuizTimerEnd={onQuizTimerEnd}
        onQuizQuestionEnd={onQuizQuestionEnd}
        participantCount={participantCount ?? 0}
        theme={presentation?.theme}
      />

      <PresentControls
        visible={showControls}
        slideIndex={slideIndex}
        totalSlides={totalSlides}
        quizStepLabel={quizStepLabel}
        isFirst={isFirst}
        isLast={isLast}
        isFullscreen={isFullscreen}
        onExit={exitPresent}
        onPrev={goPrev}
        onNext={goNext}
        onToggleFullscreen={toggleFullscreen}
      />

      <PresentNavHint visible={showControls && !isFirst} />
    </div>
  );
}
