export interface SlideThemeTokens {
  bg?: string;
  surface?: string;
  text?: string;
  muted?: string;
  heading?: string;
  accent?: string;
  fontHeading?: string;
  fontBody?: string;
  radius?: number;
}

export type ResolvedSlideTheme = Required<SlideThemeTokens>;

export interface PresentationTheme {
  base?: string;
  overrides?: SlideThemeTokens;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
}

export type QuizPhase = "question" | "answering" | "results";

export interface QuizState {
  elementId: string;
  phase: QuizPhase;
  startedAt: number;
}

export type ElementType =
  | "heading"
  | "text"
  | "image"
  | "shape"
  | "quiz"
  | "wordcloud"
  | "leaderboard"
  | "qrcode";

export interface ElementProps {
  content?: string;
  fontSize?: number;
  bold?: boolean;
  align?: "left" | "center" | "right";
  src?: string;
  color?: string;
  objectFit?: string;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  shapeType?: string;
  question?: string;
  options?: string[];
  correctOption?: number;
  timerSeconds?: number;
  timeScoring?: boolean;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  prompt?: string;
  maxResponses?: number;
  heightFitted?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Presentation {
  id: string;
  title: string;
  joinCode: string | null;
  liveSlideId: string | null;
  quizState: QuizState | null;
  theme: PresentationTheme | null;
  createdAt: number;
  updatedAt: number;
}

export interface FirstSlidePreview {
  bg: string | null;
  elements: SlideElement[];
}

export interface Slide {
  id: string;
  presentationId: string;
  order: number;
  title: string | null;
  bg: string | null;
  createdAt: number;
}

export interface SlideElement {
  id: string;
  slideId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number | null;
  props: ElementProps | null;
  createdAt: number;
}

export interface AudienceResponse {
  id: string;
  elementId: string;
  participantId: string;
  participantName: string | null;
  value: string;
  correct: boolean | null;
  score: number | null;
  createdAt: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  correct: number;
  total: number;
}
