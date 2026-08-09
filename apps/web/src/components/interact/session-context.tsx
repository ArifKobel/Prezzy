import type { AudienceResponse, QuizState, ResolvedSlideTheme } from "@Prezzy/shared";
import { createContext, useContext } from "react";

export interface InteractSession {
  presentationId: string;
  theme: ResolvedSlideTheme;
  participantId: string;
  participantName: string;
  quizState: QuizState | null;
  submit: (elementId: string, value: string) => Promise<AudienceResponse>;
}

const SessionContext = createContext<InteractSession | null>(null);

export const InteractSessionProvider = SessionContext.Provider;

export function useInteractSession(): InteractSession {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useInteractSession must be used within InteractSessionProvider");
  return ctx;
}
