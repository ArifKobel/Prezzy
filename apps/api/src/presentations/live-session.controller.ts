import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { LeaderboardEntry, Presentation, User } from "../shared";
import { SetLiveSlideDto } from "./dto/set-live-slide.dto";
import { SetQuizDto } from "./dto/set-quiz.dto";
import { LiveSessionService } from "./live-session.service";

@Controller("presentations")
@UseGuards(AuthGuard)
export class LiveSessionController {
  constructor(private readonly live: LiveSessionService) {}

  @Post(":id/live-slide")
  setLiveSlide(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Body() dto: SetLiveSlideDto,
  ): Promise<Presentation> {
    return this.live.setLiveSlide(id, user.id, dto.slideId ?? null);
  }

  @Post(":id/quiz")
  setQuiz(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Body() dto: SetQuizDto,
  ): Promise<Presentation> {
    return this.live.setQuiz(id, user.id, dto);
  }

  @Delete(":id/quiz")
  clearQuiz(@Param("id") id: string, @CurrentUser() user: User): Promise<Presentation> {
    return this.live.clearQuiz(id, user.id);
  }

  @Get(":id/leaderboard")
  leaderboard(@Param("id") id: string, @CurrentUser() user: User): Promise<LeaderboardEntry[]> {
    return this.live.leaderboard(id, user.id);
  }

  @Get(":id/participant-count")
  participantCount(
    @Param("id") id: string,
    @CurrentUser() user: User,
  ): Promise<{ count: number }> {
    return this.live.participantCount(id, user.id);
  }

  @Delete(":id/responses")
  clearResponses(
    @Param("id") id: string,
    @CurrentUser() user: User,
  ): Promise<{ deleted: number }> {
    return this.live.clearResponses(id, user.id);
  }
}
