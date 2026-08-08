import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { Presentation, User } from "../shared";
import { CreatePresentationDto } from "./dto/create-presentation.dto";
import { UpdatePresentationDto } from "./dto/update-presentation.dto";
import { PresentationsService } from "./presentations.service";

@Controller("presentations")
@UseGuards(AuthGuard)
export class PresentationsController {
  constructor(private readonly presentations: PresentationsService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<Presentation[]> {
    return this.presentations.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreatePresentationDto): Promise<Presentation> {
    return this.presentations.create(user.id, dto);
  }

  @Get(":id")
  get(@Param("id") id: string, @CurrentUser() user: User): Promise<Presentation> {
    return this.presentations.get(id, user.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdatePresentationDto,
  ): Promise<Presentation> {
    return this.presentations.update(id, user.id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: User): Promise<void> {
    return this.presentations.remove(id, user.id);
  }
}
