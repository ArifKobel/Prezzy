import { Injectable } from "@nestjs/common";
import type { AuthInfo, OAuthTokenVerifier } from "@modelcontextprotocol/server";
import { OAuthError, OAuthErrorCode } from "@modelcontextprotocol/server";
import { AuthService } from "@/auth/auth.service";
import { OAuthService } from "@/oauth/oauth.service";

@Injectable()
export class McpAuthService implements OAuthTokenVerifier {
  constructor(
    private readonly auth: AuthService,
    private readonly oauth: OAuthService,
  ) {}

  get resourceUrl(): URL {
    return new URL(this.oauth.resource);
  }

  get issuer(): string {
    return this.oauth.issuer;
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const info = await this.resolve(token);
    if (!info) throw new OAuthError(OAuthErrorCode.InvalidToken, "Invalid access token");
    return info;
  }

  private async resolve(token: string): Promise<AuthInfo | null> {
    const payload = await this.oauth.verifyAccessToken(token).catch(() => undefined);
    if (!payload?.accountId || !payload.exp) return null;
    const user = await this.auth.findById(payload.accountId);
    if (!user) return null;
    return {
      token,
      clientId: payload.clientId ?? "unknown",
      scopes: payload.scope?.split(" ").filter(Boolean) ?? [],
      expiresAt: payload.exp,
      resource: this.resourceUrl,
      extra: { userId: user.id, issuer: this.issuer },
    };
  }
}
