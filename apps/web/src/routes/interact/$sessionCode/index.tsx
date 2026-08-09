import type { ElementType, SlideElement } from "@Prezzy/shared";
import { resolveSlideTheme } from "@Prezzy/shared/theme";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FollowAlong } from "@/components/interact/follow-along";
import { JoinForm } from "@/components/interact/join-form";
import { LeaderboardInteraction } from "@/components/interact/leaderboard-interaction";
import { QuizInteraction } from "@/components/interact/quiz-interaction";
import { SessionNotFound } from "@/components/interact/session-not-found";
import { InteractSessionProvider } from "@/components/interact/session-context";
import { Shell } from "@/components/interact/shell";
import { SlidePeek } from "@/components/interact/slide-peek";
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

const INTERACTIONS: Partial<Record<ElementType, React.ComponentType<{ element: SlideElement }>>> = {
  quiz: QuizInteraction,
  wordcloud: WordCloudInteraction,
  leaderboard: LeaderboardInteraction,
};

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

  const theme = useMemo(() => resolveSlideTheme(presentation?.theme), [presentation?.theme]);

  const session = useMemo(() => {
    if (!presentation) return null;
    return {
      presentationId: presentation.id,
      theme,
      participantId: participantId.current,
      participantName: name,
      quizState,
      submit: (elementId: string, value: string) =>
        submitResponse({
          elementId,
          participantId: participantId.current,
          participantName: name || undefined,
          value,
        }),
    };
  }, [presentation, theme, name, quizState, submitResponse]);

  if (presentation === undefined) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="font-sans text-sm text-muted-foreground">Connecting...</p>
        </div>
      </Shell>
    );
  }

  if (presentation === null || !session) {
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

  const interactiveEl = elements?.find((el) => el.type in INTERACTIONS);
  const Interaction = interactiveEl ? INTERACTIONS[interactiveEl.type] : null;

  return (
    <InteractSessionProvider value={session}>
      <Shell
        title={presentation.title}
        name={name}
        onChangeName={() => setNameSubmitted(false)}
      >
        {!liveSlideId ? (
          <WaitingRoom />
        ) : (
          <>
            <SlidePeek elements={elements ?? []} theme={presentation.theme} />
            {Interaction && interactiveEl ? (
              <Interaction element={interactiveEl} />
            ) : (
              <FollowAlong />
            )}
          </>
        )}
      </Shell>
    </InteractSessionProvider>
  );
}
