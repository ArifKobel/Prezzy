import { Injectable, NotFoundException, OnModuleDestroy, UnauthorizedException } from "@nestjs/common";
import { chromium, type Browser } from "playwright";
import { env } from "@/config/env";
import { DeckService } from "@/deck-actions/deck.service";
import { clippedTextWarnings, waitForAssets } from "@/mcp/preview/preview-scripts";
import { signPreviewToken, verifyPreviewToken, type PreviewClaims } from "@/mcp/preview/preview-token";

const VIEWPORT = { width: 960, height: 540 };
const NAVIGATION_TIMEOUT = 15_000;

export interface SlideRender {
  png: Buffer;
  warnings: string[];
}

@Injectable()
export class PreviewService implements OnModuleDestroy {
  private browser: Promise<Browser> | null = null;

  constructor(private readonly deck: DeckService) {}

  async data(token: string) {
    return this.slideData(this.claims(token));
  }

  async render(userId: string, presentationId: string, slideId: string): Promise<SlideRender> {
    await this.slideData({ userId, presentationId, slideId });
    const url = new URL("/mcp/preview", env.webOrigin);
    url.searchParams.set("token", signPreviewToken({ userId, presentationId, slideId }));

    const page = await (await this.getBrowser()).newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    try {
      await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT });
      await page.locator("[data-mcp-preview-ready]").waitFor({ state: "visible", timeout: NAVIGATION_TIMEOUT });
      await page.evaluate(waitForAssets);
      const warnings = await page.evaluate(clippedTextWarnings);
      return { png: await page.screenshot({ type: "png" }), warnings };
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) await (await this.browser).close();
  }

  private claims(token: string): PreviewClaims {
    try {
      return verifyPreviewToken(token);
    } catch {
      throw new UnauthorizedException("Invalid preview token");
    }
  }

  private async slideData({ userId, presentationId, slideId }: PreviewClaims) {
    const deck = await this.deck.get(userId, presentationId);
    const slide = deck.slides.find((candidate) => candidate.id === slideId);
    if (!slide) throw new NotFoundException("Slide not found");
    return {
      presentationId,
      title: deck.title,
      theme: deck.theme,
      slide,
      elements: deck.elements.filter((element) => element.slideId === slideId),
    };
  }

  private getBrowser(): Promise<Browser> {
    this.browser ??= chromium.launch({ headless: true });
    return this.browser;
  }
}
