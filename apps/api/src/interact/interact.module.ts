import { Module } from "@nestjs/common";
import { InteractService } from "@/interact/interact.service";
import { JoinController } from "@/interact/join.controller";
import { ResponsesController } from "@/interact/responses.controller";
import { ResponsesService } from "@/interact/responses.service";

@Module({
  controllers: [JoinController, ResponsesController],
  providers: [InteractService, ResponsesService],
  exports: [InteractService, ResponsesService],
})
export class InteractModule {}
