import { UnauthorizedException } from "@nestjs/common";
import { env } from "@/config/env";

export type GoogleProfile = { email: string; name: string };

const redirectUri = `${env.publicUrl}/api/auth/google/callback`;

export const googleAuthUrl = (state: string): string =>
  `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: env.googleClientId ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
  })}`;

export async function fetchGoogleProfile(code: string): Promise<GoogleProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId ?? "",
      client_secret: env.googleClientSecret ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new UnauthorizedException("Google sign in failed");
  const { id_token } = (await res.json()) as { id_token?: string };
  const encodedPayload = id_token?.split(".")[1];
  if (!encodedPayload) throw new UnauthorizedException("Google sign in failed");
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (!payload.email || payload.email_verified !== true) {
    throw new UnauthorizedException("Google account has no verified email");
  }
  return { email: payload.email, name: payload.name ?? payload.email };
}
