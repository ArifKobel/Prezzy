import { Body, Controller, Delete, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { Slide, User } from "../shared";
import { UpdateSlideDto } from "./dto/update-slide.dto";
import { SlidesService } from "./slides.service";

@Controller("slides")
@UseGuards(AuthGuard)
export class SlidesController {
  constructor(private readonly slides: SlidesService) {}

  @Post(":id/duplicate")
  duplicate(@Param("id") id: string, @CurrentUser() user: User): Promise<Slide> {
    return this.slides.duplicate(id, user.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateSlideDto,
  ): Promise<Slide> {
    return this.slides.updateTitle(id, user.id, dto.title);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: User): Promise<void> {
    return this.slides.remove(id, user.id);
  }
}
