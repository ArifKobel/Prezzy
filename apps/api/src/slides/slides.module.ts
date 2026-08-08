import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PresentationSlidesController } from "./presentation-slides.controller";
import { SlidesController } from "./slides.controller";
import { SlidesService } from "./slides.service";

@Module({
  imports: [AuthModule],
  controllers: [SlidesController, PresentationSlidesController],
  providers: [SlidesService],
  exports: [SlidesService],
})
export class SlidesModule {}
