import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import type { Interaction } from "oidc-provider";
import type { AuthenticatedRequest } from "@/auth/authenticated-request";
import { OptionalAuthGuard } from "@/auth/optional-auth.guard";
import { env } from "@/config/env";
import { OAuthService } from "@/oauth/oauth.service";

@Controller("oauth-interactions")
@UseGuards(OptionalAuthGuard)
export class OAuthController {
  constructor(private readonly oauth: OAuthService) {}

  @Get(":uid")
  async details(@Param("uid") uid: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const interaction = await this.interaction(uid, req, res);
    const client = await this.oauth.provider.Client.find(interaction.params.client_id as string);
    if (!client) throw new BadRequestException("Unknown client");
    return res.json({
      uid,
      prompt: interaction.prompt.name,
      client: { id: client.clientId, name: client.clientName ?? client.clientId },
      scopes: String(interaction.params.scope ?? "")
        .split(" ")
        .filter(Boolean),
      user: req.user ?? null,
    });
  }

  @Post(":uid")
  async decide(
    @Param("uid") uid: string,
    @Body() body: { decision?: string },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    if (req.get("origin") !== env.webOrigin) throw new ForbiddenException("Invalid origin");
    const interaction = await this.interaction(uid, req, res);

    if (body.decision === "deny") {
      return this.oauth.provider.interactionFinished(req, res, {
        error: "access_denied",
        error_description: "The user denied access",
      });
    }

    const user = req.user;
    if (!user) throw new UnauthorizedException("Authentication required");

    if (interaction.prompt.name === "login") {
      return this.oauth.provider.interactionFinished(req, res, {
        login: { accountId: user.id, amr: ["pwd"], remember: false },
      });
    }

    const grantId = await this.oauth.saveGrant(interaction, user.id);
    return this.oauth.provider.interactionFinished(
      req,
      res,
      { consent: interaction.grantId ? {} : { grantId } },
      { mergeWithLastSubmission: true },
    );
  }

  private async interaction(uid: string, req: AuthenticatedRequest, res: Response): Promise<Interaction> {
    const interaction = await this.oauth.provider
      .interactionDetails(req, res)
      .catch(() => null);
    if (!interaction || interaction.uid !== uid) {
      throw new BadRequestException("Invalid or expired authorization request");
    }
    return interaction;
  }
}
