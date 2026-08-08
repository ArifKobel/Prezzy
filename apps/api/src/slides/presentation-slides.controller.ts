import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { Slide, User } from "../shared";
import { CreateSlideDto } from "./dto/create-slide.dto";
import { CreateSlideFromLayoutDto } from "./dto/create-slide-from-layout.dto";
import { ReorderSlidesDto } from "./dto/reorder-slides.dto";
import { SlidesService } from "./slides.service";

@Controller("presentations")
@UseGuards(AuthGuard)
export class PresentationSlidesController {
  constructor(private readonly slides: SlidesService) {}

  @Get(":presentationId/slides")
  list(@Param("presentationId") presentationId: string, @CurrentUser() user: User): Promise<Slide[]> {
    return this.slides.listByPresentation(presentationId, user.id);
  }

  @Post(":presentationId/slides")
  create(
    @Param("presentationId") presentationId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateSlideDto,
  ): Promise<Slide> {
    return this.slides.create(presentationId, user.id, dto.afterOrder);
  }

  @Post(":presentationId/slides/from-layout")
  createFromLayout(
    @Param("presentationId") presentationId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateSlideFromLayoutDto,
  ): Promise<Slide> {
    return this.slides.createFromLayout(presentationId, user.id, dto);
  }

  @Post(":presentationId/slides/reorder")
  @HttpCode(204)
  reorder(
    @Param("presentationId") presentationId: string,
    @CurrentUser() user: User,
    @Body() dto: ReorderSlidesDto,
  ): Promise<void> {
    return this.slides.reorder(presentationId, user.id, dto.slideIds);
  }
}
