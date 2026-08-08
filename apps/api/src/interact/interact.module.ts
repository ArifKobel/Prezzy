import { Module } from "@nestjs/common";
import { InteractService } from "./interact.service";
import { JoinController } from "./join.controller";
import { ResponsesController } from "./responses.controller";
import { ResponsesService } from "./responses.service";

@Module({
  controllers: [JoinController, ResponsesController],
  providers: [InteractService, ResponsesService],
  exports: [InteractService, ResponsesService],
})
export class InteractModule {}
