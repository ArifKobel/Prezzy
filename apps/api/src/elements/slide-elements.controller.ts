import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { SlideElement, User } from "../shared";
import { CreateElementDto } from "./dto/create-element.dto";
import { ElementsService } from "./elements.service";

@Controller("slides")
export class SlideElementsController {
  constructor(private readonly elements: ElementsService) {}

  @Get(":slideId/elements")
  list(@Param("slideId") slideId: string): Promise<SlideElement[]> {
    return this.elements.listBySlide(slideId);
  }

  @Post(":slideId/elements")
  @UseGuards(AuthGuard)
  create(
    @Param("slideId") slideId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateElementDto,
  ): Promise<SlideElement> {
    return this.elements.create(slideId, user.id, dto);
  }
}
