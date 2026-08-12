import { resolveSlideTheme } from "@Prezzy/shared/theme";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import DemoButton from "@/components/demo-button";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { slideThemeStyle } from "@/components/slide-canvas";
import { meQueryOptions } from "@/lib/api/auth";

export const Route = createFileRoute("/")({
  component: LandingPage,
  loader: async ({ context: { queryClient } }) => {
    const user = await queryClient.ensureQueryData(meQueryOptions).catch(() => null);
    if (user) throw redirect({ to: "/dashboard" });
  },
});

const SLIDE_MS = 5200;
const INK = resolveSlideTheme({ base: "ink" });

const SLIDE_TITLES = ["Intro", "Live quiz", "Word cloud", "Your turn"];

const QUIZ_OPTIONS = [
  { label: "Bullet point #47", votes: 23, width: 42 },
  { label: "Monotone voice", votes: 31, width: 56 },
  { label: "No way to join in", votes: 46, width: 84, winner: true },
];

const CLOUD_WORDS: Array<{
  text: string;
  x: number;
  y: number;
  size: number;
  accent?: boolean;
  tilt?: number;
}> = [
  { text: "interactive", x: 50, y: 46, size: 9, accent: true },
  { text: "fun", x: 26, y: 30, size: 6.5 },
  { text: "finally", x: 74, y: 28, size: 5.5, accent: true, tilt: -4 },
  { text: "wow", x: 18, y: 58, size: 5, tilt: 3 },
  { text: "engaging", x: 66, y: 64, size: 6 },
  { text: "again!", x: 84, y: 48, size: 4, tilt: -6 },
  { text: "smooth", x: 34, y: 72, size: 4.5 },
  { text: "loved it", x: 52, y: 22, size: 4, tilt: 5 },
];

const pop = (delayMs: number): React.CSSProperties => ({
  animation: "landing-pop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both",
  animationDelay: `${delayMs}ms`,
});

function IntroSlide() {
  return (
    <div className="flex h-full flex-col items-start justify-center px-[8cqw]">
      <p
        className="text-[2.2cqw] uppercase tracking-[0.25em] [color:var(--slide-muted)]"
        style={pop(100)}
      >
        This hero is a Prezzy deck
      </p>
      <h2
        className="mt-[2cqw] text-[9cqw] font-bold leading-none [font-family:var(--slide-font-heading)]"
        style={pop(250)}
      >
        Meet Prezzy<span className="[color:var(--slide-accent)]">.</span>
      </h2>
      <p className="mt-[3cqw] text-[2.6cqw] [color:var(--slide-muted)]" style={pop(450)}>
        Sit back. It presents itself.
      </p>
    </div>
  );
}

function QuizSlide() {
  return (
    <div className="flex h-full flex-col justify-center px-[8cqw]">
      <h2
        className="text-[4.6cqw] font-bold [font-family:var(--slide-font-heading)]"
        style={pop(100)}
      >
        What kills a presentation?
      </h2>
      <div className="mt-[4cqw] flex w-[62%] flex-col gap-[2.2cqw]">
        {QUIZ_OPTIONS.map((option, i) => (
          <div key={option.label} style={pop(300 + i * 150)}>
            <div className="mb-[0.8cqw] flex items-baseline justify-between text-[2.4cqw]">
              <span>{option.label}</span>
              <span className="[color:var(--slide-muted)]">{option.votes}</span>
            </div>
            <div className="h-[2.6cqw] w-full overflow-hidden rounded-full [background:var(--slide-surface)]">
              <div
                className="h-full origin-left rounded-full"
                style={{
                  width: `${option.width}%`,
                  background: option.winner ? "var(--slide-accent)" : "var(--slide-muted)",
                  animation: "landing-grow 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both",
                  animationDelay: `${500 + i * 150}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

function CloudSlide() {
  return (
    <div className="h-full">
      <p
        className="absolute left-1/2 top-[10%] -translate-x-1/2 text-[2.2cqw] uppercase tracking-[0.25em] [color:var(--slide-muted)]"
        style={pop(100)}
      >
        Your last all-hands, in one word
      </p>
      {CLOUD_WORDS.map((word, i) => (
        <span
          key={word.text}
          className="absolute -translate-x-1/2 -translate-y-1/2 font-bold [font-family:var(--slide-font-heading)]"
          style={{
            left: `${word.x}%`,
            top: `${word.y}%`,
            fontSize: `${word.size}cqw`,
            color: word.accent ? "var(--slide-accent)" : "var(--slide-text)",
            rotate: `${word.tilt ?? 0}deg`,
            opacity: word.accent ? 1 : 0.55 + word.size / 30,
            ...pop(250 + i * 140),
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
}

function TurnSlide() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <h2
        className="text-[9cqw] font-bold leading-none [font-family:var(--slide-font-heading)]"
        style={pop(100)}
      >
        Your turn<span className="[color:var(--slide-accent)]">.</span>
      </h2>
      <p className="mt-[2.4cqw] text-[2.4cqw] [color:var(--slide-muted)]" style={pop(300)}>
        Sign in and build your first deck in minutes.
      </p>
      <Link
        to="/login"
        className="mt-[3.6cqw] inline-flex items-center gap-[1cqw] rounded-full px-[3.6cqw] py-[1.6cqw] text-[2.2cqw] font-bold transition-transform hover:scale-105"
        style={{
          background: "var(--slide-accent)",
          color: "var(--slide-on-accent)",
          ...pop(500),
        }}
      >
        Start creating
      </Link>
    </div>
  );
}

const SLIDES = [IntroSlide, QuizSlide, CloudSlide, TurnSlide];

function Stage() {
  const [slide, setSlide] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [slide, cycle]);

  const CurrentSlide = SLIDES[slide];

  return (
    <div className="w-full">
      <div
        className="relative aspect-video w-full overflow-hidden rounded-md shadow-[0_24px_80px_rgba(27,30,34,0.18)] [container-type:inline-size]"
        style={slideThemeStyle(INK)}
      >
        <div key={`${slide}-${cycle}`} className="absolute inset-0">
          <CurrentSlide />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        {SLIDE_TITLES.map((title, i) => (
          <button
            key={title}
            aria-label={title}
            onClick={() => {
              setSlide(i);
              setCycle((c) => c + 1);
            }}
            className="py-2"
          >
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-border">
              {i === slide && (
                <div
                  key={`${slide}-${cycle}`}
                  className="h-full origin-left bg-primary"
                  style={{ animation: `landing-progress ${SLIDE_MS}ms linear both` }}
                />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const ABOUT_POINTS = [
  {
    title: "Build",
    body: "A slide editor with layouts, themes, images, and shapes. Everyone editing a deck sees each other's changes as they happen.",
  },
  {
    title: "Present",
    body: "Run your deck full screen and share a join code or QR link. Your audience needs no account and no app install.",
  },
  {
    title: "Interact",
    body: "Live quizzes with scoring and leaderboards, plus word clouds that grow as answers come in from the room.",
  },
];

function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-surface">
      <nav className="flex items-center justify-between px-6 py-4 sm:px-10">
        <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Prezzy<span className="text-primary">.</span>
        </span>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/ArifKobel/Prezzy"
            target="_blank"
            rel="noreferrer"
            className="font-sans text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <Link
            to="/login"
            className="rounded-full border border-foreground/20 px-4 py-1.5 font-sans text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto grid w-full max-w-[1500px] flex-1 items-center gap-14 px-6 py-12 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div>
            <h1 className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both font-display text-[clamp(3rem,4.5vw,5.2rem)] font-extrabold leading-[0.92] tracking-tight text-foreground duration-500">
              Slides that
              <br />
              talk back<span className="text-primary">.</span>
            </h1>
            <p className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-7 max-w-md font-sans text-base leading-relaxed text-muted-foreground delay-200 duration-500">
              Build decks together in real time, then hand your audience a QR code: live
              quizzes, word clouds and leaderboards, straight from their phones.
            </p>
            <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-9 flex items-center gap-4 delay-300 duration-500">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-primary px-6 py-3 font-sans text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-dim"
              >
                Start creating <ArrowRight className="size-3.5" />
              </Link>
              <DemoButton className="inline-flex items-center gap-2 border border-foreground/20 px-6 py-3 font-sans text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40">
                Try the live demo
              </DemoButton>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-400 duration-700">
            <Stage />
          </div>
        </section>

        <section className="border-t border-border px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-[1240px]">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              What Prezzy is<span className="text-primary">.</span>
            </h2>
            <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground">
              Prezzy is a web app for building presentations and running them live. You write your
              slides in an editor that syncs between everyone working on the same deck. When you
              present, your audience joins from their phones with a short code or a QR link and
              answers quizzes and word clouds while you talk, with the results appearing on your
              slide in real time.
            </p>

            <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-12">
              {ABOUT_POINTS.map((point) => (
                <div key={point.title}>
                  <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
                    {point.title}
                  </h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
                    {point.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-14 max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground">
              Accounts are free. You can sign up with an email address and a password, or use Sign
              in with Google, which Prezzy uses only to read your name and email address in order to
              create your account. Prezzy never posts anything to your Google account and requests
              no access to your other Google data. How we handle your data is described in our{" "}
              <Link to="/privacy" className="font-semibold text-primary hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between">
          <p className="font-sans text-[11px] text-muted-foreground/50">
            © 2026 Prezzy. All rights reserved.
          </p>
          <div className="flex items-center gap-6 font-sans text-[11px] text-muted-foreground/50">
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <span>MIT licensed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
