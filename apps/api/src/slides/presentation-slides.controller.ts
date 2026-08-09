import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { CurrentUser } from "@/auth/current-user.decorator";
import type { Slide, User } from "@/shared";
import { SlidesService } from "@/slides/slides.service";

@Controller("presentations")
@UseGuards(AuthGuard)
export class PresentationSlidesController {
  constructor(private readonly slides: SlidesService) {}

  @Get(":presentationId/slides")
  list(@Param("presentationId") presentationId: string, @CurrentUser() user: User): Promise<Slide[]> {
    return this.slides.listByPresentation(presentationId, user.id);
  }
}
