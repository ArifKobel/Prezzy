import { sign, verify } from "jsonwebtoken";
import { env } from "@/config/env";

const AUDIENCE = "prezzy:slide-preview";
const TTL_SECONDS = 60;

export interface PreviewClaims {
  userId: string;
  presentationId: string;
  slideId: string;
}

export const signPreviewToken = (claims: PreviewClaims): string =>
  sign(claims, env.jwtSecret, { audience: AUDIENCE, issuer: env.publicUrl, expiresIn: TTL_SECONDS });

export function verifyPreviewToken(token: string): PreviewClaims {
  const { userId, presentationId, slideId } = verify(token, env.jwtSecret, {
    audience: AUDIENCE,
    issuer: env.publicUrl,
  }) as PreviewClaims;
  return { userId, presentationId, slideId };
}
