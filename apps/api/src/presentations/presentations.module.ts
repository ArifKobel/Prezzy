import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { LiveSessionController } from "@/presentations/live-session.controller";
import { LiveSessionService } from "@/presentations/live-session.service";
import { PresentationsController } from "@/presentations/presentations.controller";
import { PresentationsService } from "@/presentations/presentations.service";

@Module({
  imports: [AuthModule],
  controllers: [PresentationsController, LiveSessionController],
  providers: [PresentationsService, LiveSessionService],
  exports: [PresentationsService, LiveSessionService],
})
export class PresentationsModule {}
