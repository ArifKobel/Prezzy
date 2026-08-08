import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { LiveSessionController } from "./live-session.controller";
import { LiveSessionService } from "./live-session.service";
import { PresentationsController } from "./presentations.controller";
import { PresentationsService } from "./presentations.service";

@Module({
  imports: [AuthModule],
  controllers: [PresentationsController, LiveSessionController],
  providers: [PresentationsService, LiveSessionService],
  exports: [PresentationsService, LiveSessionService],
})
export class PresentationsModule {}
