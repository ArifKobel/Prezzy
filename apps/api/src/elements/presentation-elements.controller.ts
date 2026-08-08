import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { CurrentUser } from "@/auth/current-user.decorator";
import type { SlideElement, User } from "@/shared";
import { ElementsService } from "@/elements/elements.service";

@Controller("presentations")
@UseGuards(AuthGuard)
export class PresentationElementsController {
  constructor(private readonly elements: ElementsService) {}

  @Get(":presentationId/elements")
  list(
    @Param("presentationId") presentationId: string,
    @CurrentUser() user: User,
  ): Promise<SlideElement[]> {
    return this.elements.listByPresentation(presentationId, user.id);
  }

  @Get(":presentationId/first-slide-elements")
  firstSlide(
    @Param("presentationId") presentationId: string,
    @CurrentUser() user: User,
  ): Promise<SlideElement[]> {
    return this.elements.listFirstSlide(presentationId, user.id);
  }
}
