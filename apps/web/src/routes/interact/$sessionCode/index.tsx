import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FollowAlong } from "@/components/interact/follow-along";
import { JoinForm } from "@/components/interact/join-form";
import { QuizInteraction } from "@/components/interact/quiz-interaction";
import { SessionNotFound } from "@/components/interact/session-not-found";
import { Shell } from "@/components/interact/shell";
import { WaitingRoom } from "@/components/interact/waiting-room";
import { WordCloudInteraction } from "@/components/interact/word-cloud-interaction";
import { useSlideElements } from "@/lib/api/elements";
import {
  useHeartbeat, usePresentationByJoinCode, useSubmitResponse,
} from "@/lib/api/interact";
import { useRealtime } from "@/lib/api/socket";

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

  useRealtime(`join:${sessionCode}`);

  const { data: presentation } = usePresentationByJoinCode(sessionCode);
  const liveSlideId = presentation?.liveSlideId ?? null;
  const quizState = presentation?.quizState ?? null;

  const { data: elements } = useSlideElements(liveSlideId);

  const submitResponse = useSubmitResponse();
  const heartbeat = useHeartbeat();
  const participantId = useRef(getParticipantId());

  const [name, setName] = useState(getSavedName);
  const [nameSubmitted, setNameSubmitted] = useState(!!getSavedName());

  useEffect(() => {
    if (!presentation?.id || !nameSubmitted) return;
    const send = () =>
      heartbeat({
        joinCode: sessionCode,
        participantId: participantId.current,
        participantName: name || undefined,
      }).catch(() => {});
    send();
    const interval = setInterval(send, 10_000);
    return () => clearInterval(interval);
  }, [presentation?.id, nameSubmitted, name, heartbeat, sessionCode]);

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
