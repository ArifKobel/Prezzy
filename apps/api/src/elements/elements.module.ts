import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ElementsController } from "./elements.controller";
import { ElementsService } from "./elements.service";
import { PresentationElementsController } from "./presentation-elements.controller";
import { SlideElementsController } from "./slide-elements.controller";

@Module({
  imports: [AuthModule],
  controllers: [ElementsController, SlideElementsController, PresentationElementsController],
  providers: [ElementsService],
  exports: [ElementsService],
})
export class ElementsModule {}
