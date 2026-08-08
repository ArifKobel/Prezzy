import { Global, Module } from "@nestjs/common";
import { AccessService } from "@/access/access.service";

@Global()
@Module({
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
