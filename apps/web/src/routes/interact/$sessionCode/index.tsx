import { api } from "@Prezzy/backend/convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FollowAlong } from "@/components/interact/follow-along";
import { JoinForm } from "@/components/interact/join-form";
import { QuizInteraction } from "@/components/interact/quiz-interaction";
import { SessionNotFound } from "@/components/interact/session-not-found";
import { Shell } from "@/components/interact/shell";
import { WaitingRoom } from "@/components/interact/waiting-room";
import { WordCloudInteraction } from "@/components/interact/word-cloud-interaction";

export const Route = createFileRoute("/interact/$sessionCode/")({
  component: AudiencePage,
});

function getParticipantId(): string {
  const key = "prezzy-participant-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getSavedName(): string {
  return localStorage.getItem("prezzy-participant-name") ?? "";
}

function saveName(name: string) {
  localStorage.setItem("prezzy-participant-name", name);
}

function AudiencePage() {
  const { sessionCode } = Route.useParams();

  const presentation = useQuery(api.interactive.getByJoinCode, {
    joinCode: sessionCode,
  });
  const liveSlideId = presentation?.liveSlideId ?? null;
  const quizState = presentation?.quizState ?? null;

  const elements = useQuery(
    api.slideElements.listBySlide,
    liveSlideId ? { slideId: liveSlideId } : "skip",
  );

  const submitResponse = useMutation(api.interactive.submitResponse);
  const heartbeat = useMutation(api.interactive.heartbeat);
  const participantId = useRef(getParticipantId());

  const [name, setName] = useState(getSavedName);
  const [nameSubmitted, setNameSubmitted] = useState(!!getSavedName());

  useEffect(() => {
    if (!presentation?._id || !nameSubmitted) return;
    const send = () =>
      heartbeat({
        presentationId: presentation._id,
        participantId: participantId.current,
        participantName: name || undefined,
      }).catch(() => {});
    send();
    const interval = setInterval(send, 10_000);
    return () => clearInterval(interval);
  }, [presentation?._id, nameSubmitted, name, heartbeat]);

  const interactiveEl = elements?.find(
    (el) => el.type === "quiz" || el.type === "wordcloud",
  );

  if (presentation === undefined) {
    return (
      <Shell>
        <Loader2 className="size-6 animate-spin text-[#4e6073]" />
        <p className="font-sans text-sm text-[#2f3333]/40">Connecting...</p>
      </Shell>
    );
  }

  if (presentation === null) {
    return (
      <Shell>
        <SessionNotFound />
      </Shell>
    );
  }

  if (!nameSubmitted) {
    return (
      <Shell title={presentation.title}>
        <JoinForm
          name={name}
          setName={setName}
          onJoin={() => {
            saveName(name.trim());
            setNameSubmitted(true);
          }}
        />
      </Shell>
    );
  }

  if (!liveSlideId) {
    return (
      <Shell title={presentation.title} name={name}>
        <WaitingRoom name={name} />
      </Shell>
    );
  }

  if (!interactiveEl) {
    return (
      <Shell title={presentation.title} name={name}>
        <FollowAlong />
      </Shell>
    );
  }

  return (
    <Shell title={presentation.title} name={name}>
      {interactiveEl.type === "quiz" && (
        <QuizInteraction
          element={interactiveEl}
          participantId={participantId.current}
          participantName={name}
          submitResponse={submitResponse}
          quizState={quizState}
          theme={presentation.theme}
        />
      )}
      {interactiveEl.type === "wordcloud" && (
        <WordCloudInteraction
          element={interactiveEl}
          participantId={participantId.current}
          participantName={name}
          submitResponse={submitResponse}
          theme={presentation.theme}
        />
      )}
    </Shell>
  );
}
