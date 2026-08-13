import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: process.env.ENV_FILE });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const port = Number(process.env.PORT ?? 3001);

export const env = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  port,
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${port}`,
  oauthCookieSecret: process.env.OAUTH_COOKIE_SECRET ?? required("JWT_SECRET"),
  oauthJwks: process.env.OAUTH_JWKS ? JSON.parse(process.env.OAUTH_JWKS) : undefined,
  cookieDomain: process.env.COOKIE_DOMAIN,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  uploadDir: resolve(process.env.UPLOAD_DIR ?? "uploads"),
};
