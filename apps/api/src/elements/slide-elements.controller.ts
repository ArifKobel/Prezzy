import { Controller, Get, Param } from "@nestjs/common";
import type { SlideElement } from "@/shared";
import { ElementsService } from "@/elements/elements.service";

@Controller("slides")
export class SlideElementsController {
  constructor(private readonly elements: ElementsService) {}

  @Get(":slideId/elements")
  list(@Param("slideId") slideId: string): Promise<SlideElement[]> {
    return this.elements.listBySlide(slideId);
  }
}
