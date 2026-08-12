import type { ElementProps, ElementType } from "@/shared";

interface DemoElement {
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  props: ElementProps;
}

export interface DemoSlide {
  title: string;
  elements: DemoElement[];
}

const centered = (size: number, text: string): string =>
  `<p style="text-align: center"><span style="font-size: ${size}px;">${text}</span></p>`;

export const DEMO_SLIDES: DemoSlide[] = [
  {
    title: "Welcome",
    elements: [
      {
        type: "heading",
        x: 10,
        y: 26,
        width: 80,
        height: 14,
        props: {
          content:
            '<p style="text-align: center"><strong><span style="font-size: 60px;">This is Prezzy.</span></strong></p>',
        },
      },
      {
        type: "text",
        x: 15,
        y: 44,
        width: 70,
        height: 18,
        props: {
          content: centered(
            22,
            "A collaborative presentation tool with a live audience layer. This deck is your demo workspace: click anything and start editing.",
          ),
        },
      },
    ],
  },
  {
    title: "Features",
    elements: [
      {
        type: "heading",
        x: 8,
        y: 8,
        width: 84,
        height: 12,
        props: {
          content: '<p><strong><span style="font-size: 42px;">What you can try</span></strong></p>',
        },
      },
      {
        type: "text",
        x: 8,
        y: 22,
        width: 84,
        height: 65,
        props: {
          content:
            '<ul><li><p><span style="font-size: 20px;">Edit slides with layouts, themes, shapes, and images</span></p></li><li><p><span style="font-size: 20px;">Open this deck in a second tab and watch edits sync in real time</span></p></li><li><p><span style="font-size: 20px;">Hit Present: your audience joins with a code or QR from their phones</span></p></li><li><p><span style="font-size: 20px;">Run the quiz and word cloud on the next two slides live</span></p></li></ul>',
        },
      },
    ],
  },
  {
    title: "Quiz",
    elements: [
      {
        type: "quiz",
        x: 5,
        y: 10,
        width: 90,
        height: 75,
        props: {
          question: "What keeps everyone's edits in sync?",
          options: ["Carrier pigeons", "CRDTs (Yjs)", "Polling every second", "Copy and paste"],
          correctOption: 1,
          timerSeconds: 20,
        },
      },
    ],
  },
  {
    title: "Word cloud",
    elements: [
      {
        type: "heading",
        x: 8,
        y: 8,
        width: 84,
        height: 12,
        props: {
          content:
            '<p style="text-align: center"><strong><span style="font-size: 42px;">Ask the room anything</span></strong></p>',
        },
      },
      {
        type: "wordcloud",
        x: 8,
        y: 24,
        width: 84,
        height: 64,
        props: { prompt: "Describe this demo in one word" },
      },
    ],
  },
  {
    title: "Your turn",
    elements: [
      {
        type: "heading",
        x: 10,
        y: 30,
        width: 80,
        height: 14,
        props: {
          content:
            '<p style="text-align: center"><strong><span style="font-size: 52px;">Your turn.</span></strong></p>',
        },
      },
      {
        type: "text",
        x: 15,
        y: 48,
        width: 70,
        height: 16,
        props: {
          content: centered(
            20,
            "Sign up to keep your decks, or browse the source on GitHub. This workspace cleans itself up after a day.",
          ),
        },
      },
    ],
  },
];
