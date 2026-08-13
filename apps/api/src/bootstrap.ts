import { type INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { socketIdContext } from "@/events/socket-id-context";
import { PROTECTED_RESOURCE_METADATA_PATH } from "@/mcp/mcp.constants";
import { publicOAuthOrigin } from "@/oauth/oauth-mount";
import { OAuthService } from "@/oauth/oauth.service";

export function configureApp(app: INestApplication): void {
  const oauth = app.get(OAuthService);
  app.use("/api/oauth", publicOAuthOrigin(oauth.publicOrigin), oauth.provider.callback());
  app.setGlobalPrefix("api", { exclude: [PROTECTED_RESOURCE_METADATA_PATH] });
  app.use(cookieParser());
  app.use(socketIdContext);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
