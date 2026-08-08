import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import type { Presentation } from "@/shared";
import { HeartbeatDto } from "@/interact/dto/heartbeat.dto";
import { InteractService } from "@/interact/interact.service";

@Controller("join")
export class JoinController {
  constructor(private readonly interact: InteractService) {}

  @Get(":code")
  get(@Param("code") code: string): Promise<Presentation> {
    return this.interact.getByJoinCode(code);
  }

  @Post(":code/heartbeat")
  @HttpCode(200)
  heartbeat(@Param("code") code: string, @Body() dto: HeartbeatDto): Promise<{ count: number }> {
    return this.interact.heartbeat(code, dto);
  }
}
