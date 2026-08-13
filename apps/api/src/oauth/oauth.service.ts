import { Inject, Injectable } from "@nestjs/common";
import type Provider from "oidc-provider";
import type { Account, AdapterPayload, Configuration, Interaction } from "oidc-provider";
import { AuthService } from "@/auth/auth.service";
import { env } from "@/config/env";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { oauthAdapter } from "@/oauth/oauth-adapter";

export const OIDC_PROVIDER_CLASS = Symbol("OIDC_PROVIDER_CLASS");
type ProviderClass = typeof Provider;

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

@Injectable()
export class OAuthService {
  readonly issuer = new URL("/api/oauth", env.publicUrl).toString().replace(/\/$/, "");
  readonly resource = new URL("/api/mcp", env.publicUrl).toString();
  readonly provider: Provider;
  readonly publicOrigin = new URL(env.publicUrl).origin;

  constructor(
    @Inject(DRIZZLE) db: Database,
    private readonly auth: AuthService,
    @Inject(OIDC_PROVIDER_CLASS) Provider: ProviderClass,
  ) {
    const configuration: Configuration = {
      adapter: oauthAdapter(db),
      clients: [],
      clientDefaults: {
        application_type: "native",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      },
      cookies: {
        keys: [env.oauthCookieSecret],
        long: { signed: true, sameSite: "lax", secure: this.secure, httpOnly: true, path: "/" },
        short: { signed: true, sameSite: "lax", secure: this.secure, httpOnly: true, path: "/" },
      },
      jwks: env.oauthJwks,
      features: {
        devInteractions: { enabled: false },
        clientIdMetadataDocument: {
          enabled: true,
          ack: "draft-02",
          allowFetch: (_ctx, clientId) => this.safeMetadataUrl(clientId),
          allowClient: (_ctx, client) =>
            client.tokenEndpointAuthMethod === "none" &&
            client.grantTypes?.includes("authorization_code") === true &&
            client.responseTypes?.includes("code") === true,
        },
        registration: { enabled: false },
        resourceIndicators: {
          enabled: true,
          defaultResource: () => this.resource,
          useGrantedResource: () => true,
          getResourceServerInfo: (_ctx, resource) => {
            if (resource !== this.resource) throw new Error("unknown resource");
            return {
              scope: "presentations:read presentations:write",
              audience: this.resource,
              accessTokenFormat: "opaque",
              accessTokenTTL: 60 * 60,
            };
          },
        },
      },
      findAccount: async (_ctx, accountId): Promise<Account | undefined> => {
        const user = await this.auth.findById(accountId);
        if (!user) return undefined;
        return {
          accountId: user.id,
          claims: () => ({ sub: user.id, name: user.name, email: user.email }),
        };
      },
      interactions: {
        url: (_ctx, interaction) =>
          `${env.webOrigin}/oauth/authorize?uid=${encodeURIComponent(interaction.uid)}`,
      },
      pkce: { required: () => true },
      scopes: ["openid", "offline_access", "presentations:read", "presentations:write"],
      ttl: {
        AccessToken: 60 * 60,
        AuthorizationCode: 5 * 60,
        Interaction: 10 * 60,
        RefreshToken: 30 * 24 * 60 * 60,
      },
      claims: {
        openid: ["sub"],
        profile: ["name"],
        email: ["email"],
      },
      discovery: {
        client_id_metadata_document_supported: true,
        authorization_response_iss_parameter_supported: true,
      },
    };
    this.provider = new Provider(this.issuer, configuration);
    this.provider.proxy = true;
  }

  async saveGrant(interaction: Interaction, accountId: string): Promise<string> {
    const grant = interaction.grantId
      ? await this.provider.Grant.find(interaction.grantId)
      : new this.provider.Grant({ accountId, clientId: interaction.params.client_id as string });
    if (!grant) throw new Error("Grant not found");

    const details = interaction.prompt.details;
    const scopes = strings(details.missingOIDCScope);
    const claims = strings(details.missingOIDCClaims);
    if (scopes.length > 0) grant.addOIDCScope(scopes);
    if (claims.length > 0) grant.addOIDCClaims(claims);
    for (const [resource, missing] of Object.entries(details.missingResourceScopes ?? {})) {
      const resourceScopes = strings(missing);
      if (resourceScopes.length > 0) grant.addResourceScope(resource, resourceScopes);
    }
    return grant.save();
  }

  async verifyAccessToken(token: string): Promise<AdapterPayload | undefined> {
    const accessToken = await this.provider.AccessToken.find(token);
    const audiences = accessToken
      ? Array.isArray(accessToken.aud)
        ? accessToken.aud
        : [accessToken.aud]
      : [];
    if (!accessToken || !audiences.includes(this.resource) || !accessToken.accountId) return undefined;
    return {
      accountId: accessToken.accountId,
      clientId: accessToken.clientId,
      scope: accessToken.scope,
      aud: accessToken.aud,
      exp: accessToken.exp,
    };
  }

  private get secure(): boolean {
    return env.publicUrl.startsWith("https://");
  }

  private safeMetadataUrl(clientId: string): boolean {
    try {
      const url = new URL(clientId);
      return (
        url.protocol === "https:" &&
        url.pathname !== "/" &&
        !url.username &&
        !url.password &&
        url.hostname !== "localhost" &&
        url.hostname !== "127.0.0.1" &&
        url.hostname !== "::1"
      );
    } catch {
      return false;
    }
  }
}
