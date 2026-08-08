import { Body, Controller, Delete, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { SlideElement, User } from "../shared";
import { ReorderElementDto } from "./dto/reorder-element.dto";
import { UpdateElementDto } from "./dto/update-element.dto";
import { ElementsService } from "./elements.service";

@Controller("elements")
@UseGuards(AuthGuard)
export class ElementsController {
  constructor(private readonly elements: ElementsService) {}

  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateElementDto,
  ): Promise<SlideElement> {
    return this.elements.update(id, user.id, dto);
  }

  @Post(":id/reorder")
  @HttpCode(204)
  reorder(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Body() dto: ReorderElementDto,
  ): Promise<void> {
    return this.elements.reorder(id, user.id, dto.action);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: User): Promise<void> {
    return this.elements.remove(id, user.id);
  }
}
