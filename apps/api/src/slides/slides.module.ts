import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PresentationSlidesController } from "@/slides/presentation-slides.controller";
import { SlidesController } from "@/slides/slides.controller";
import { SlidesService } from "@/slides/slides.service";

@Module({
  imports: [AuthModule],
  controllers: [SlidesController, PresentationSlidesController],
  providers: [SlidesService],
  exports: [SlidesService],
})
export class SlidesModule {}
