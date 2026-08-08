import { Global, Module } from "@nestjs/common";
import { PresenceService } from "@/presence/presence.service";

@Global()
@Module({
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
