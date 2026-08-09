import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { ElementsService } from "@/elements/elements.service";
import { PresentationElementsController } from "@/elements/presentation-elements.controller";
import { SlideElementsController } from "@/elements/slide-elements.controller";

@Module({
  imports: [AuthModule],
  controllers: [SlideElementsController, PresentationElementsController],
  providers: [ElementsService],
  exports: [ElementsService],
})
export class ElementsModule {}
