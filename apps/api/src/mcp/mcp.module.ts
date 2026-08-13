import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from "@nestjs/common";
import { getOAuthProtectedResourceMetadataUrl, requireBearerAuth } from "@modelcontextprotocol/express";
import { AuthModule } from "@/auth/auth.module";
import { DeckActionsModule } from "@/deck-actions/deck-actions.module";
import { McpAuthService } from "@/mcp/mcp-auth.service";
import { McpController } from "@/mcp/mcp.controller";
import { McpService } from "@/mcp/mcp.service";
import { PreviewController } from "@/mcp/preview/preview.controller";
import { PreviewService } from "@/mcp/preview/preview.service";
import { OAuthModule } from "@/oauth/oauth.module";

@Module({
  imports: [AuthModule, DeckActionsModule, OAuthModule],
  controllers: [McpController, PreviewController],
  providers: [McpAuthService, McpService, PreviewService],
})
export class McpModule implements NestModule {
  constructor(private readonly auth: McpAuthService) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        requireBearerAuth({
          verifier: this.auth,
          resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(this.auth.resourceUrl),
        }),
      )
      .forRoutes({ path: "mcp", method: RequestMethod.ALL });
  }
}
