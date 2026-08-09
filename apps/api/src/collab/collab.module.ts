import { Module } from "@nestjs/common";
import { AccessModule } from "@/access/access.module";
import { AuthModule } from "@/auth/auth.module";
import { CollabGateway } from "@/collab/collab.gateway";
import { DocRegistryService } from "@/collab/doc-registry.service";

@Module({
  imports: [AuthModule, AccessModule],
  providers: [DocRegistryService, CollabGateway],
  exports: [DocRegistryService],
})
export class CollabModule {}
