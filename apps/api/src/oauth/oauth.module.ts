import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { OAuthController } from "@/oauth/oauth.controller";
import { OIDC_PROVIDER_CLASS, OAuthService } from "@/oauth/oauth.service";

const importEsm = (specifier: string) => import(specifier) as Promise<typeof import("oidc-provider")>;

@Module({
  imports: [AuthModule],
  controllers: [OAuthController],
  providers: [
    {
      provide: OIDC_PROVIDER_CLASS,
      useFactory: async () => (await importEsm("oidc-provider")).default,
    },
    OAuthService,
  ],
  exports: [OAuthService],
})
export class OAuthModule {}
