import { All, Controller, ForbiddenException, Get, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { env } from "@/config/env";
import { McpAuthService } from "@/mcp/mcp-auth.service";
import { MCP_SCOPES, PROTECTED_RESOURCE_METADATA_PATH } from "@/mcp/mcp.constants";
import { McpService } from "@/mcp/mcp.service";

@Controller()
export class McpController {
  private readonly allowedOrigins = new Set([env.webOrigin, new URL(env.publicUrl).origin]);

  constructor(
    private readonly mcp: McpService,
    private readonly auth: McpAuthService,
  ) {}

  @Get(PROTECTED_RESOURCE_METADATA_PATH)
  metadata() {
    return {
      resource: this.auth.resourceUrl.toString(),
      authorization_servers: [this.auth.issuer],
      scopes_supported: [...MCP_SCOPES],
      resource_name: "Prezzy MCP",
    };
  }

  @All("mcp")
  async handle(@Req() request: Request, @Res() response: Response): Promise<void> {
    const origin = request.get("origin");
    if (origin && !this.allowedOrigins.has(origin)) throw new ForbiddenException();
    await this.mcp.nodeHandler(request, response, request.body);
  }
}
